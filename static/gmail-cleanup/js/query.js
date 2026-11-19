// Builds the Gmail search query from the filter form.
// Pure functions only: no DOM, no network, so it can be unit-tested in Node.

export const CATEGORIES = ['promotions', 'social', 'updates', 'forums'];
export const AGE_UNITS = { d: 'days', m: 'months', y: 'years' };

const SENDER_PATTERN = /^[a-z0-9._%+@-]+$/i;

/** Splits a comma/space separated sender list and rejects anything that is not a plain address or domain. */
export function parseSenders(text) {
	const parts = String(text ?? '')
		.split(/[\s,;]+/)
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);
	const invalid = parts.filter((part) => !SENDER_PATTERN.test(part));
	return { senders: [...new Set(parts.filter((part) => SENDER_PATTERN.test(part)))], invalid };
}

/** True when every bracket and quote in a hand-written query is closed, so it cannot escape its group. */
export function isBalanced(text) {
	const closers = { ')': '(', '}': '{' };
	const stack = [];
	let inQuote = false;
	for (const char of text) {
		if (char === '"') inQuote = !inQuote;
		else if (inQuote) continue;
		else if (char === '(' || char === '{') stack.push(char);
		else if (char in closers && stack.pop() !== closers[char]) return false;
	}
	return !inQuote && stack.length === 0;
}

function positiveInt(value) {
	const number = Number(value);
	return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * @returns {{ query: string, errors: string[], narrowing: boolean }}
 * `narrowing` is false when nothing limits the search: the caller must refuse
 * to run it, because the protections alone would match most of the mailbox.
 */
export function buildQuery(filters = {}) {
	const errors = [];
	const terms = [];

	if (filters.category) {
		if (CATEGORIES.includes(filters.category)) terms.push(`category:${filters.category}`);
		else errors.push('Unknown category.');
	}

	if (filters.olderThan !== '' && filters.olderThan != null) {
		const amount = positiveInt(filters.olderThan);
		const unit = filters.olderUnit in AGE_UNITS ? filters.olderUnit : null;
		if (amount && unit) terms.push(`older_than:${amount}${unit}`);
		else errors.push('"Older than" must be a whole number above zero.');
	}

	if (filters.largerThanMb !== '' && filters.largerThanMb != null) {
		const megabytes = positiveInt(filters.largerThanMb);
		if (megabytes) terms.push(`larger:${megabytes}M`);
		else errors.push('"Larger than" must be a whole number of megabytes above zero.');
	}

	// The typed From box and the saved remove list both limit the search to those senders.
	const { senders, invalid } = parseSenders([filters.from ?? '', ...(filters.removeSenders ?? [])].join(' '));
	if (invalid.length) errors.push(`Not a valid address or domain: ${invalid.join(', ')}`);
	if (senders.length === 1) terms.push(`from:${senders[0]}`);
	else if (senders.length > 1) terms.push(`from:(${senders.join(' OR ')})`);

	if (filters.unreadOnly) terms.push('is:unread');
	if (filters.hasAttachment) terms.push('has:attachment');

	const raw = String(filters.raw ?? '').trim();
	if (raw) {
		if (/[\r\n]/.test(raw)) errors.push('The custom search must be a single line.');
		else if (!isBalanced(raw)) errors.push('The custom search has an unclosed bracket or quote.');
		else terms.push(`(${raw})`);
	}

	const narrowing = terms.length > 0;

	// Protections are appended last and ANDed with everything above.
	const keep = parseSenders((filters.keepSenders ?? []).join(' ')).senders;
	for (const sender of keep) terms.push(`-from:${sender}`);
	if (filters.protectStarred !== false) terms.push('-is:starred');
	if (filters.protectImportant !== false) terms.push('-is:important');
	if (filters.protectSent !== false) terms.push('-in:sent', '-in:drafts');
	if (filters.protectLabelled) terms.push('has:nouserlabels');

	if (!narrowing && !errors.length) {
		errors.push('Pick at least one filter. Cleaning the whole mailbox at once is not allowed.');
	}

	return { query: terms.join(' '), errors, narrowing };
}

/** Pulls the bare address out of a From header such as `"Shop" <news@shop.example>`. */
export function senderAddress(fromHeader) {
	const text = String(fromHeader ?? '');
	const match = text.match(/<([^<>\s]+)>\s*$/);
	return (match ? match[1] : text).trim().toLowerCase();
}

/** Counts senders in a sample, most frequent first. */
export function topSenders(messages, limit = 8) {
	const counts = new Map();
	for (const message of messages) {
		const address = senderAddress(message.from);
		if (address) counts.set(address, (counts.get(address) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, limit)
		.map(([address, count]) => ({ address, count }));
}

/** Picks up to `count` items evenly spaced across a list, always including the first and last. */
export function spread(items, count) {
	if (items.length <= count) return [...items];
	if (count <= 1) return items.slice(0, Math.max(0, count));
	const step = (items.length - 1) / (count - 1);
	return Array.from({ length: count }, (_, index) => items[Math.round(index * step)]);
}

/** Splits a query into top-level terms, keeping bracketed groups and quoted phrases whole. */
function tokenize(text) {
	const tokens = [];
	let current = '';
	let depth = 0;
	let inQuote = false;
	for (const char of text) {
		if (char === '"') inQuote = !inQuote;
		else if (!inQuote && (char === '(' || char === '{')) depth++;
		else if (!inQuote && (char === ')' || char === '}')) depth--;
		if (/\s/.test(char) && depth === 0 && !inQuote) {
			if (current) tokens.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	if (current) tokens.push(current);
	return tokens;
}

/** True when one pair of round brackets encloses the entire text. */
function isWrapped(text) {
	if (!text.startsWith('(') || !text.endsWith(')')) return false;
	return isBalanced(text.slice(1, -1));
}

/**
 * Turns a search copied from "Search that will run" back into filter values,
 * so buildQuery(parseQuery(q)).query === q for any search this tool produced.
 * Anything it does not recognise is returned as the custom search.
 * Protections are only ever switched on by a pasted search, never off.
 * Returns null when the text is not a well-formed single-line search.
 */
export function parseQuery(text) {
	const input = String(text ?? '').trim();
	if (!input || /[\r\n]/.test(input) || !isBalanced(input)) return null;

	const filters = {
		category: '', olderThan: '', olderUnit: 'm', largerThanMb: '', from: '', raw: '',
		unreadOnly: false, hasAttachment: false, protectLabelled: false, keepSenders: [], removeSenders: []
	};
	const senders = [];
	const rest = [];
	let match;

	for (const token of tokenize(input)) {
		if (!filters.category && (match = token.match(/^category:([a-z]+)$/)) && CATEGORIES.includes(match[1])) {
			filters.category = match[1];
		} else if (!filters.olderThan && (match = token.match(/^older_than:([1-9]\d*)([dmy])$/))) {
			[, filters.olderThan, filters.olderUnit] = match;
		} else if (!filters.largerThanMb && (match = token.match(/^larger:([1-9]\d*)M$/))) {
			filters.largerThanMb = match[1];
		} else if (!senders.length && (match = token.match(/^from:\((.+)\)$/)) &&
			match[1].split(' OR ').every((part) => SENDER_PATTERN.test(part))) {
			senders.push(...match[1].split(' OR '));
		} else if (!senders.length && (match = token.match(/^from:(.+)$/)) && SENDER_PATTERN.test(match[1])) {
			senders.push(match[1]);
		} else if ((match = token.match(/^-from:(.+)$/)) && SENDER_PATTERN.test(match[1])) {
			filters.keepSenders.push(match[1].toLowerCase());
		} else if (token === 'is:unread') {
			filters.unreadOnly = true;
		} else if (token === 'has:attachment') {
			filters.hasAttachment = true;
		} else if (token === 'has:nouserlabels') {
			filters.protectLabelled = true;
		} else if (!['-is:starred', '-is:important', '-in:sent', '-in:drafts'].includes(token)) {
			rest.push(token);
		}
	}

	filters.removeSenders = [...new Set(senders.map((sender) => sender.toLowerCase()))];
	filters.keepSenders = [...new Set(filters.keepSenders)];
	// buildQuery wraps the custom search in brackets, so take one layer off here.
	filters.raw = rest.length === 1 && isWrapped(rest[0]) ? rest[0].slice(1, -1) : rest.join(' ');
	return filters;
}
