import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery, isBalanced, parseQuery, senderAddress, spread, topSenders } from '../static/gmail-cleanup/js/query.js';
import { ACTIONS, GmailError, createClient } from '../static/gmail-cleanup/js/gmail.js';

const PROTECTIONS = '-is:starred -is:important -in:sent -in:drafts';

test('builds a query with protections appended', () => {
	const { query, errors } = buildQuery({ category: 'promotions', olderThan: '6', olderUnit: 'm' });
	assert.deepEqual(errors, []);
	assert.equal(query, `category:promotions older_than:6m ${PROTECTIONS}`);
});

test('refuses to run with no narrowing filter', () => {
	const { errors, narrowing } = buildQuery({});
	assert.equal(narrowing, false);
	assert.equal(errors.length, 1);
});

test('protections alone do not count as narrowing', () => {
	assert.equal(buildQuery({ protectLabelled: true, keepSenders: ['a@b.example'] }).narrowing, false);
});

test('rejects bad numbers and senders', () => {
	assert.ok(buildQuery({ olderThan: '-3', olderUnit: 'd' }).errors.length);
	assert.ok(buildQuery({ olderThan: '1.5', olderUnit: 'd' }).errors.length);
	assert.ok(buildQuery({ largerThanMb: '0' }).errors.length);
	assert.ok(buildQuery({ from: 'a@b.example) OR is:starred (' }).errors.length);
	assert.ok(buildQuery({ category: 'primary OR in:anywhere' }).errors.length);
});

test('combines several senders and keeps exclusions', () => {
	const { query } = buildQuery({ from: 'a@x.example, y.example', keepSenders: ['boss@y.example'] });
	assert.equal(query, `from:(a@x.example OR y.example) -from:boss@y.example ${PROTECTIONS}`);
});

test('a custom search is grouped so it cannot bypass protections', () => {
	const { query, errors } = buildQuery({ raw: 'subject:sale OR is:starred' });
	assert.deepEqual(errors, []);
	assert.equal(query, `(subject:sale OR is:starred) ${PROTECTIONS}`);
	assert.ok(buildQuery({ raw: 'subject:sale) OR (is:starred' }).errors.length);
	assert.ok(buildQuery({ raw: 'subject:"sale' }).errors.length);
});

test('isBalanced ignores brackets inside quotes', () => {
	assert.equal(isBalanced('subject:"a ) b"'), true);
	assert.equal(isBalanced('{a (b)}'), true);
	assert.equal(isBalanced('(a}'), false);
});

test('sender parsing and ranking', () => {
	assert.equal(senderAddress('"Shop <3" <News@Shop.example>'), 'news@shop.example');
	assert.equal(senderAddress('plain@x.example'), 'plain@x.example');
	const ranked = topSenders([{ from: 'A <a@x.example>' }, { from: 'b@x.example' }, { from: 'a@x.example' }]);
	assert.deepEqual(ranked, [{ address: 'a@x.example', count: 2 }, { address: 'b@x.example', count: 1 }]);
});

/* ───────────── API client with a fake fetch ───────────── */

function fakeFetch(handler) {
	const calls = [];
	const fetchImpl = async (url, options) => {
		calls.push({ url: new URL(url), options });
		const { status = 200, body = {} } = await handler(new URL(url), options, calls.length);
		return { ok: status >= 200 && status < 300, status, json: async () => body };
	};
	return { fetchImpl, calls };
}

const noSleep = async () => {};

test('requests carry the bearer token, no cookies, and go only to Gmail', async () => {
	const { fetchImpl, calls } = fakeFetch(() => ({ body: { emailAddress: 'me@example.com' } }));
	const client = createClient({ getToken: () => 'tok', fetchImpl });
	await client.getProfile();
	assert.equal(calls[0].url.origin, 'https://gmail.googleapis.com');
	assert.equal(calls[0].options.headers.Authorization, 'Bearer tok');
	assert.equal(calls[0].options.credentials, 'omit');
});

test('fails closed without a token', async () => {
	const { fetchImpl, calls } = fakeFetch(() => ({}));
	const client = createClient({ getToken: () => null, fetchImpl });
	await assert.rejects(client.getProfile(), GmailError);
	assert.equal(calls.length, 0);
});

test('listIds paginates, dedupes, stops at the cap, and never includes spam or trash', async () => {
	const { fetchImpl, calls } = fakeFetch((url) => {
		const page = Number(url.searchParams.get('pageToken') ?? 0);
		const messages = Array.from({ length: 500 }, (_, i) => ({ id: (page * 500 + i).toString(16) }));
		return { body: { messages, nextPageToken: String(page + 1) } };
	});
	const client = createClient({ getToken: () => 'tok', fetchImpl });
	const { ids, truncated } = await client.listIds('category:promotions', { cap: 1200 });
	assert.equal(ids.length, 1200);
	assert.equal(new Set(ids).size, 1200);
	assert.equal(truncated, true);
	assert.equal(calls.length, 3);
	assert.equal(calls[0].url.searchParams.get('includeSpamTrash'), 'false');
	assert.equal(calls[0].url.searchParams.get('q'), 'category:promotions');
});

test('listIds drops malformed ids', async () => {
	const { fetchImpl } = fakeFetch(() => ({ body: { messages: [{ id: 'abc123' }, { id: '../profile' }] } }));
	const client = createClient({ getToken: () => 'tok', fetchImpl });
	const { ids, truncated } = await client.listIds('x');
	assert.deepEqual(ids, ['abc123']);
	assert.equal(truncated, false);
});

test('retries rate limits, then succeeds', async () => {
	const { fetchImpl, calls } = fakeFetch((url, options, n) =>
		n < 3 ? { status: 429, body: { error: { message: 'slow down' } } } : { body: { emailAddress: 'me@example.com' } });
	const client = createClient({ getToken: () => 'tok', fetchImpl, sleep: noSleep });
	assert.equal((await client.getProfile()).emailAddress, 'me@example.com');
	assert.equal(calls.length, 3);
});

test('modify batches by 1000 and reports exactly what was changed on failure', async () => {
	const ids = Array.from({ length: 2500 }, (_, i) => i.toString(16));
	const { fetchImpl, calls } = fakeFetch((url, options, n) =>
		n === 3 ? { status: 403, body: { error: { message: 'nope' } } } : { status: 204 });
	const client = createClient({ getToken: () => 'tok', fetchImpl, sleep: noSleep });
	const error = await client.modify(ids, ACTIONS.trash.apply).catch((e) => e);
	assert.ok(error instanceof GmailError);
	assert.equal(error.doneIds.length, 2000);
	const body = JSON.parse(calls[0].options.body);
	assert.equal(body.ids.length, 1000);
	assert.deepEqual(body.addLabelIds, ['TRASH']);
	assert.ok(calls.every((call) => call.url.pathname.endsWith('/messages/batchModify')));
});

test('modify falls back to per-message trash when the batch is refused', async () => {
	const { fetchImpl, calls } = fakeFetch((url) =>
		url.pathname.endsWith('/batchModify') ? { status: 400, body: { error: { message: 'Invalid label' } } } : { body: {} });
	const client = createClient({ getToken: () => 'tok', fetchImpl });
	const done = await client.modify(['a1', 'b2'], ACTIONS.trash.apply);
	assert.deepEqual(done.sort(), ['a1', 'b2']);
	assert.deepEqual(calls.slice(1).map((call) => call.url.pathname.split('/').pop()), ['trash', 'trash']);
});

test('no action can delete permanently', () => {
	for (const action of Object.values(ACTIONS)) {
		const labels = [...(action.apply.add ?? []), ...(action.apply.remove ?? [])];
		assert.ok(labels.every((label) => ['TRASH', 'INBOX'].includes(label)));
	}
});

test('spread samples evenly across the whole list', () => {
	const items = Array.from({ length: 5000 }, (_, i) => i);
	const picked = spread(items, 300);
	assert.equal(picked.length, 300);
	assert.equal(new Set(picked).size, 300);
	assert.equal(picked[0], 0);
	assert.equal(picked.at(-1), 4999);
	assert.deepEqual(spread([1, 2, 3], 10), [1, 2, 3]);
});

test('a copied search round-trips through parseQuery', () => {
	const cases = [
		{ category: 'promotions', olderThan: '6', olderUnit: 'm' },
		{ olderThan: '2', olderUnit: 'y', unreadOnly: true, hasAttachment: true, largerThanMb: '10' },
		{ from: 'a@x.example', keepSenders: ['boss@y.example', 'venmo@venmo.com'] },
		{ from: 'a@x.example, y.example', protectLabelled: true },
		{ raw: 'subject:(receipt OR invoice)' },
		{ raw: 'subject:"a ) b" label:old', category: 'updates' },
		{ raw: '(is:unread OR is:starred)', keepSenders: ['k@z.example'] }
	];
	for (const filters of cases) {
		const { query, errors } = buildQuery(filters);
		assert.deepEqual(errors, []);
		assert.equal(buildQuery(parseQuery(query)).query, query);
	}
});

test('parseQuery fills fields and leaves the rest as the custom search', () => {
	const parsed = parseQuery('category:social older_than:3m label:news -from:keep@x.example -is:starred');
	assert.equal(parsed.category, 'social');
	assert.equal(parsed.olderThan, '3');
	assert.equal(parsed.raw, 'label:news');
	assert.deepEqual(parsed.keepSenders, ['keep@x.example']);
	assert.equal(parseQuery('subject:"unclosed'), null);
	assert.equal(parseQuery('a) OR (b'), null);
});

test('a pasted search can never switch protections off', () => {
	const parsed = parseQuery('category:promotions');
	for (const key of ['protectStarred', 'protectImportant', 'protectSent']) assert.equal(key in parsed, false);
	assert.match(buildQuery(parsed).query, /-is:starred -is:important -in:sent -in:drafts$/);
});
