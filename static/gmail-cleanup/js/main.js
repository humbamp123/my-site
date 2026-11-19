import { CLIENT_ID } from './config.js';
import { buildQuery, parseQuery, senderAddress, spread, topSenders } from './query.js';
import { ACTIONS, GmailError, SCOPE, createClient } from './gmail.js';

const CLIENT_ID_PATTERN = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
const CLIENT_ID_KEY = 'gmail-cleanup.client-id';
const SAMPLE_SIZE = 300;
const TABLE_ROWS = 40;
const SENDER_ROWS = 12;

const $ = (id) => document.getElementById(id);
const number = new Intl.NumberFormat();
const dateFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// Everything sensitive lives here, in memory, and is gone when the tab closes.
const state = {
	token: null,
	expiryTimer: null,
	email: null,
	keepSenders: [],
	removeSenders: [],
	scan: null, // { ids, query, truncated }
	history: [], // { action, ids, query, undone }
	busy: false,
	abort: null
};

const client = createClient({ getToken: () => state.token });

/* ───────────── small UI helpers ───────────── */

function showError(message) {
	const box = $('errorBox');
	box.textContent = message ?? '';
	box.hidden = !message;
	if (message) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function describe(error) {
	if (error?.name === 'AbortError') return null;
	if (error instanceof GmailError) {
		if (error.status === 401) return 'Your Gmail session ended. Connect again to continue.';
		if (error.status === 403 && /insufficient|scope|permission/i.test(`${error.reason} ${error.message}`)) {
			return 'Gmail refused the request: the permission to manage mail was not granted. Disconnect, connect again, and tick the permission box.';
		}
		return `Gmail said: ${error.message}`;
	}
	if (error instanceof TypeError) return 'Could not reach Gmail. Check your connection and try again.';
	return error?.message || 'Something went wrong.';
}

function setProgress(text, value, max) {
	$('progressRow').hidden = text == null;
	if (text == null) return;
	$('progressText').textContent = text;
	const bar = $('progressBar');
	if (max) {
		bar.max = max;
		bar.value = value;
	} else {
		bar.removeAttribute('value'); // indeterminate
	}
}

function setBusy(busy) {
	state.busy = busy;
	$('cancelBtn').hidden = !busy;
	refresh();
}

function refresh() {
	const connected = Boolean(state.token);
	$('status').dataset.state = connected ? 'on' : 'off';
	$('statusText').textContent = connected ? 'Connected' : 'Not connected';
	$('connectBtn').hidden = connected;
	$('disconnectBtn').hidden = !connected;
	$('accountText').textContent = connected && state.email ? `Signed in as ${state.email}` : '';
	$('setupPanel').hidden = connected || Boolean(CLIENT_ID);
	$('filters').disabled = !connected || state.busy;

	const built = buildQuery(readFilters());
	$('queryText').textContent = built.narrowing ? built.query : '—';
	$('queryNote').textContent = built.errors.join(' ');
	$('scanBtn').disabled = !connected || state.busy || built.errors.length > 0;
	$('cap').disabled = !connected || state.busy;
	$('copyBtn').disabled = !built.narrowing || built.errors.length > 0;

	$('runBtn').disabled = !connected || state.busy || !state.scan?.ids.length || !$('confirmCheck').checked;
	for (const button of document.querySelectorAll('.undo-btn')) button.disabled = !connected || state.busy;
}

/* ───────────── sign-in ───────────── */

function clientId() {
	return (CLIENT_ID || $('clientId').value).trim();
}

function waitForGoogle(timeoutMs = 8000) {
	return new Promise((resolve, reject) => {
		const started = Date.now();
		(function check() {
			if (window.google?.accounts?.oauth2) return resolve(window.google.accounts.oauth2);
			if (Date.now() - started > timeoutMs) {
				return reject(new Error('Google sign-in did not load. An ad or tracker blocker may be stopping accounts.google.com.'));
			}
			setTimeout(check, 100);
		})();
	});
}

function dropToken() {
	clearTimeout(state.expiryTimer);
	state.token = null;
	state.abort?.abort();
}

async function connect() {
	showError(null);
	const id = clientId();
	if (!CLIENT_ID_PATTERN.test(id)) {
		showError('That does not look like a Google OAuth client ID. It should end in .apps.googleusercontent.com.');
		return;
	}
	try {
		const oauth = await waitForGoogle();
		const response = await new Promise((resolve, reject) => {
			oauth.initTokenClient({
				client_id: id,
				scope: SCOPE,
				callback: resolve,
				error_callback: (error) => reject(new Error(
					error?.type === 'popup_closed' ? 'Sign-in was cancelled.'
						: error?.type === 'popup_failed_to_open' ? 'The sign-in window was blocked. Allow pop-ups for this page and try again.'
							: 'Google sign-in failed.'
				))
			}).requestAccessToken();
		});
		if (response.error || !response.access_token) {
			throw new Error(response.error === 'access_denied' ? 'Access was not granted.' : 'Google sign-in failed.');
		}
		if (!oauth.hasGrantedAllScopes(response, SCOPE)) {
			oauth.revoke(response.access_token, () => {});
			throw new Error('The permission to manage mail was not ticked on the Google screen, so the tool cannot work. Try again and tick it.');
		}

		state.token = response.access_token;
		clearTimeout(state.expiryTimer);
		state.expiryTimer = setTimeout(() => {
			dropToken();
			showError('Your Gmail session expired (Google limits it to about an hour). Connect again to continue.');
			refresh();
		}, Math.max(0, (Number(response.expires_in) || 3600) - 60) * 1000);

		const profile = await client.getProfile();
		if (state.email && state.email !== profile.emailAddress) {
			// A different account: earlier results and undo history do not apply to it.
			state.history = [];
			clearScan();
			renderHistory();
		}
		state.email = profile.emailAddress;
		if (!CLIENT_ID) localStorage.setItem(CLIENT_ID_KEY, id);
	} catch (error) {
		dropToken();
		showError(describe(error));
	}
	refresh();
}

function disconnect() {
	const token = state.token;
	dropToken();
	state.email = null;
	state.history = [];
	clearScan();
	renderHistory();
	showError(null);
	if (token) window.google?.accounts?.oauth2?.revoke(token, () => {});
	refresh();
}

/* ───────────── filters ───────────── */

function readFilters() {
	return {
		category: $('category').value,
		olderThan: $('olderThan').value,
		olderUnit: $('olderUnit').value,
		largerThanMb: $('largerThanMb').value,
		from: $('from').value,
		raw: $('raw').value,
		unreadOnly: $('unreadOnly').checked,
		hasAttachment: $('hasAttachment').checked,
		protectStarred: $('protectStarred').checked,
		protectImportant: $('protectImportant').checked,
		protectSent: $('protectSent').checked,
		protectLabelled: $('protectLabelled').checked,
		keepSenders: state.keepSenders,
		removeSenders: state.removeSenders
	};
}

const PRESETS = {
	promotions: { category: 'promotions', olderThan: '6', olderUnit: 'm' },
	social: { category: 'social', olderThan: '3', olderUnit: 'm' },
	large: { largerThanMb: '10' },
	unread: { olderThan: '1', olderUnit: 'y', unreadOnly: true },
	clear: {}
};

function applyPreset(name) {
	const preset = PRESETS[name];
	if (!preset) return;
	for (const id of ['category', 'olderThan', 'largerThanMb', 'from', 'raw']) $(id).value = preset[id] ?? '';
	$('olderUnit').value = preset.olderUnit ?? 'm';
	$('unreadOnly').checked = Boolean(preset.unreadOnly);
	$('hasAttachment').checked = false;
	// The keep and remove lists outlive a change of search; only "Clear filters" empties them.
	if (name === 'clear') {
		state.keepSenders = [];
		state.removeSenders = [];
	}
	renderKeepList();
	clearScan();
	refresh();
}

/** Fills the form from a search copied out of "Search that will run". Never unticks a protection. */
function restoreSearch(text) {
	const parsed = parseQuery(text);
	if (!parsed) return false;
	for (const id of ['category', 'olderThan', 'olderUnit', 'largerThanMb', 'from', 'raw']) $(id).value = parsed[id];
	$('unreadOnly').checked = parsed.unreadOnly;
	$('hasAttachment').checked = parsed.hasAttachment;
	if (parsed.protectLabelled) $('protectLabelled').checked = true;
	state.keepSenders = parsed.keepSenders;
	state.removeSenders = parsed.removeSenders;
	renderKeepList();
	clearScan();
	refresh();
	return true;
}

async function copySearch() {
	const { query, errors, narrowing } = buildQuery(readFilters());
	if (!narrowing || errors.length) return;
	try {
		await navigator.clipboard.writeText(query);
		$('copyNote').textContent = 'Copied. Paste it into the custom search box to restore these filters later.';
	} catch {
		$('copyNote').textContent = 'Could not copy automatically. Select the text above and copy it.';
	}
}

function renderChips(listId, chipsId, key, verb) {
	$(listId).hidden = state[key].length === 0;
	$(chipsId).replaceChildren(...state[key].map((address) => {
		const chip = document.createElement('button');
		chip.type = 'button';
		chip.className = 'keep-chip';
		chip.textContent = `${address} \u00d7`;
		chip.setAttribute('aria-label', `Stop ${verb} mail from ${address}`);
		chip.addEventListener('click', () => {
			state[key] = state[key].filter((entry) => entry !== address);
			renderKeepList();
			clearScan();
			refresh();
		});
		return chip;
	}));
}

/** Draws both saved sender lists: the ones to keep and the ones to remove. */
function renderKeepList() {
	renderChips('keepList', 'keepChips', 'keepSenders', 'keeping');
	renderChips('removeList', 'removeChips', 'removeSenders', 'removing');
}

/* ───────────── scan & review ───────────── */

function clearScan() {
	state.scan = null;
	$('reviewSection').hidden = true;
	$('confirmCheck').checked = false;
}

async function scan() {
	const built = buildQuery(readFilters());
	if (built.errors.length || !state.token) return;
	showError(null);
	clearScan();
	state.abort = new AbortController();
	const { signal } = state.abort;
	setBusy(true);
	try {
		setProgress('Searching…');
		const { ids, truncated } = await client.listIds(built.query, {
			cap: Number($('cap').value),
			signal,
			onProgress: (count) => setProgress(`Found ${number.format(count)} so far…`)
		});
		// Spread across the whole match, newest to oldest, so the review reflects all of it.
		const sampleIds = spread(ids, SAMPLE_SIZE);
		const sample = await client.sample(sampleIds, {
			signal,
			onProgress: (done) => setProgress('Loading a sample to review…', done, sampleIds.length)
		});
		state.scan = { ids, query: built.query, truncated, sample, ticked: new Set(), showAll: false };
		renderReview();
	} catch (error) {
		showError(describe(error));
		if (error instanceof GmailError && error.status === 401) dropToken();
	}
	setProgress(null);
	setBusy(false);
}

function cell(text, className) {
	const td = document.createElement('td');
	td.textContent = text;
	if (className) td.className = className;
	return td;
}

function renderReview() {
	const { ids, truncated, query, sample } = state.scan;
	const count = number.format(ids.length);
	$('reviewSection').hidden = false;
	$('reviewBody').hidden = ids.length === 0;

	if (!ids.length) {
		$('summary').textContent = 'Nothing matches. Your mailbox is already clean for this search.';
		return;
	}
	$('summary').textContent = truncated
		? `${count} messages selected, which is the per-run limit. More match this search: run it again afterwards for the rest.`
		: `${count} ${ids.length === 1 ? 'message matches' : 'messages match'}.`;

	renderSenders();

	const shown = spread(sample, TABLE_ROWS);
	$('sampleTitle').textContent = ids.length > shown.length
		? `${shown.length} of ${count}, spread from newest to oldest`
		: `All ${count}`;
	$('sampleRows').replaceChildren(...shown.map((message) => {
		const row = document.createElement('tr');
		row.append(
			cell(senderAddress(message.from) || '(unknown sender)', 'from'),
			cell(message.subject || '(no subject)'),
			cell(message.date ? dateFormat.format(message.date) : '', 'date')
		);
		return row;
	}));

	$('queryText').textContent = query;
	renderConfirm();
}

function renderSenders() {
	const { ids, sample, ticked, showAll } = state.scan;
	const complete = sample.length === ids.length;
	const senders = topSenders(sample, Infinity);
	const visible = showAll ? senders : senders.slice(0, SENDER_ROWS);

	$('sendersTitle').textContent = complete
		? `${number.format(senders.length)} ${senders.length === 1 ? 'sender' : 'senders'} across all ${number.format(ids.length)} messages`
		: `Most common senders in a sample of ${number.format(sample.length)}`;

	$('senderList').replaceChildren(...visible.map(({ address, count: seen }) => {
		const item = document.createElement('li');
		const label = document.createElement('label');
		label.className = 'check';
		const box = document.createElement('input');
		box.type = 'checkbox';
		box.value = address;
		box.checked = ticked.has(address);
		box.addEventListener('change', () => {
			if (box.checked) ticked.add(address);
			else ticked.delete(address);
			renderKeepButton();
		});
		const text = document.createElement('span');
		text.textContent = complete
			? `${address} \u2014 ${number.format(seen)}`
			: `${address} \u2014 ${seen} of ${sample.length} sampled`;
		label.append(box, text);
		item.append(label);
		return item;
	}));
	$('senderList').classList.toggle('expanded', showAll);

	$('showAllBtn').hidden = senders.length <= SENDER_ROWS;
	$('showAllBtn').textContent = showAll ? 'Show fewer' : `Show all ${number.format(senders.length)} senders`;
	$('countAllBtn').hidden = complete;
	$('countNote').hidden = complete;
	$('countAllBtn').textContent = `Find every sender in all ${number.format(ids.length)} messages`;
	$('countAllBtn').disabled = state.busy;
	renderKeepButton();
}

/** Reads the headers of every selected message, not just the sample, so no sender is missed. */
async function countAllSenders() {
	const scanned = state.scan;
	if (!scanned || state.busy) return;
	showError(null);
	const have = new Map(scanned.sample.map((message) => [message.id, message]));
	const missing = scanned.ids.filter((id) => !have.has(id));
	state.abort = new AbortController();
	setBusy(true);
	renderSenders();
	$('progressRow').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	try {
		const rest = await client.sample(missing, {
			concurrency: 8,
			signal: state.abort.signal,
			onProgress: (done) => setProgress(
				`Reading senders: ${number.format(done)} of ${number.format(missing.length)}`, done, missing.length)
		});
		for (const message of rest) have.set(message.id, message);
		if (state.scan === scanned) {
			scanned.sample = scanned.ids.map((id) => have.get(id));
			scanned.showAll = true;
		}
	} catch (error) {
		showError(describe(error));
		if (error instanceof GmailError && error.status === 401) dropToken();
	}
	setProgress(null);
	setBusy(false);
	if (state.scan === scanned) renderSenders();
}

function tickedSenders() {
	return [...(state.scan?.ticked ?? [])];
}

function renderKeepButton() {
	const ticked = tickedSenders().length;
	const noun = ticked === 1 ? 'sender' : 'senders';
	$('keepBtn').textContent = ticked ? `Keep ${ticked} ${noun} & search again` : 'Keep ticked senders';
	$('removeBtn').textContent = ticked ? `Remove only ${ticked} ${noun} & search again` : 'Remove only ticked senders';
	$('keepBtn').disabled = $('removeBtn').disabled = ticked === 0 || state.busy;
}

/** Moves the ticked senders onto one saved list (and off the other), then searches again. */
function saveTicked(key) {
	const ticked = tickedSenders();
	if (!ticked.length) return;
	const other = key === 'keepSenders' ? 'removeSenders' : 'keepSenders';
	state[key] = [...new Set([...state[key], ...ticked])];
	state[other] = state[other].filter((address) => !ticked.includes(address));
	renderKeepList();
	scan();
}

function renderConfirm() {
	if (!state.scan) return;
	const action = ACTIONS[$('action').value];
	const count = number.format(state.scan.ids.length);
	$('confirmText').textContent = `I have looked at the sample and want ${count} messages ${action.past}.`;
	$('runBtn').textContent = `${action.label}: ${count} messages`;
}

/* ───────────── clean & undo ───────────── */

async function runModify(ids, labels, verb) {
	state.abort = new AbortController();
	setBusy(true);
	let done = [];
	try {
		setProgress(`${verb}…`, 0, ids.length);
		done = await client.modify(ids, labels, {
			signal: state.abort.signal,
			onProgress: (count) => setProgress(`${verb}: ${number.format(count)} of ${number.format(ids.length)}`, count, ids.length)
		});
	} catch (error) {
		done = error.doneIds ?? [];
		const stopped = error?.name === 'AbortError';
		showError(`${stopped ? 'Stopped' : describe(error)} ${number.format(done.length)} of ${number.format(ids.length)} messages were changed before that.`);
		if (error instanceof GmailError && error.status === 401) dropToken();
	}
	setProgress(null);
	setBusy(false);
	return done;
}

async function run() {
	if (!state.scan?.ids.length || !$('confirmCheck').checked) return;
	showError(null);
	const key = $('action').value;
	const { ids, query } = state.scan;
	clearScan(); // the reviewed set is used once; a new run needs a new search
	const done = await runModify(ids, ACTIONS[key].apply, ACTIONS[key].label);
	if (done.length) state.history.unshift({ action: key, ids: done, query, undone: false });
	renderHistory();
	refresh();
}

async function undo(entry) {
	showError(null);
	const done = await runModify(entry.ids, ACTIONS[entry.action].revert, 'Undoing');
	const restored = new Set(done);
	entry.ids = entry.ids.filter((id) => !restored.has(id));
	entry.restored = (entry.restored ?? 0) + done.length;
	entry.undone = entry.ids.length === 0;
	renderHistory();
	refresh();
}

function renderHistory() {
	$('historySection').hidden = state.history.length === 0;
	$('historyList').replaceChildren(...state.history.map((entry) => {
		const item = document.createElement('li');
		const text = document.createElement('div');
		const total = number.format(entry.ids.length + (entry.restored ?? 0));
		const headline = document.createElement('strong');
		headline.textContent = entry.undone
			? `${total} messages restored`
			: `${number.format(entry.ids.length)} messages ${ACTIONS[entry.action].past}`;
		const query = document.createElement('code');
		query.textContent = entry.query;
		text.append(headline, query);
		item.append(text);
		if (!entry.undone) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'mini-btn undo-btn';
			button.textContent = 'Undo';
			button.addEventListener('click', () => undo(entry));
			item.append(button);
		}
		return item;
	}));
}

/* ───────────── start-up ───────────── */

function init() {
	// Refuse to run inside another site's frame (clickjacking). A <meta> CSP cannot enforce this.
	if (window.top !== window.self) {
		document.body.textContent = 'For your safety, Gmail Cleanup does not run inside another page. Open it directly.';
		return;
	}

	$('originText').textContent = window.location.origin;
	$('clientId').value = localStorage.getItem(CLIENT_ID_KEY) ?? '';

	$('connectBtn').addEventListener('click', connect);
	$('disconnectBtn').addEventListener('click', disconnect);
	$('scanBtn').addEventListener('click', scan);
	$('cancelBtn').addEventListener('click', () => state.abort?.abort());
	$('runBtn').addEventListener('click', run);
	$('keepBtn').addEventListener('click', () => saveTicked('keepSenders'));
	$('removeBtn').addEventListener('click', () => saveTicked('removeSenders'));
	$('countAllBtn').addEventListener('click', countAllSenders);
	$('showAllBtn').addEventListener('click', () => {
		state.scan.showAll = !state.scan.showAll;
		renderSenders();
	});
	$('confirmCheck').addEventListener('change', refresh);
	$('action').addEventListener('change', () => {
		$('confirmCheck').checked = false;
		renderConfirm();
		refresh();
	});

	for (const button of document.querySelectorAll('[data-preset]')) {
		button.addEventListener('click', () => applyPreset(button.dataset.preset));
	}
	$('copyBtn').addEventListener('click', copySearch);
	// A whole search pasted into the custom box is unpacked back into the filters above it.
	$('raw').addEventListener('paste', (event) => {
		const pasted = event.clipboardData?.getData('text') ?? '';
		const field = event.target;
		const replacesAll = field.selectionStart === 0 && field.selectionEnd === field.value.length;
		if (replacesAll && restoreSearch(pasted)) event.preventDefault();
	});
	// Any filter change invalidates what was reviewed.
	$('filters').addEventListener('input', () => {
		$('copyNote').textContent = '';
		clearScan();
		refresh();
	});

	refresh();
}

init();
