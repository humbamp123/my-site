// Minimal Gmail REST client. Talks to gmail.googleapis.com only, with the
// access token passed per request and never stored.

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_RETRIES = 5;
const LIST_PAGE_SIZE = 500;
const BATCH_SIZE = 1000; // Gmail's documented limit for batchModify
const MESSAGE_ID = /^[0-9a-f]{1,32}$/i;

/** The narrowest scope that can move mail to Trash. It cannot delete permanently or send. */
export const SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

export class GmailError extends Error {
	constructor(message, status, reason = '') {
		super(message);
		this.name = 'GmailError';
		this.status = status;
		this.reason = reason;
	}
}

function defaultSleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) return reject(signal.reason);
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener('abort', () => {
			clearTimeout(timer);
			reject(signal.reason);
		}, { once: true });
	});
}

async function pool(items, concurrency, worker) {
	let next = 0;
	const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (next < items.length) {
			const index = next++;
			await worker(items[index], index);
		}
	});
	await Promise.all(runners);
}

export function createClient({ getToken, fetchImpl = (...args) => fetch(...args), sleep = defaultSleep }) {
	async function request(path, { method = 'GET', params = {}, body, signal } = {}) {
		const url = new URL(API + path);
		for (const [key, value] of Object.entries(params)) {
			for (const item of [].concat(value)) {
				if (item != null) url.searchParams.append(key, item);
			}
		}

		for (let attempt = 0; ; attempt++) {
			const token = getToken();
			if (!token) throw new GmailError('Not connected to Gmail.', 401);

			const response = await fetchImpl(url.href, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					...(body ? { 'Content-Type': 'application/json' } : {})
				},
				body: body ? JSON.stringify(body) : undefined,
				signal,
				credentials: 'omit',
				cache: 'no-store',
				referrerPolicy: 'no-referrer'
			});

			if (response.ok) return response.status === 204 ? null : response.json();

			let detail = {};
			try {
				detail = (await response.json()).error ?? {};
			} catch {
				// Non-JSON error body: fall through with the status code alone.
			}
			const reason = detail.errors?.[0]?.reason ?? detail.status ?? '';
			const rateLimited = response.status === 429 ||
				(response.status === 403 && /rateLimitExceeded/i.test(reason));
			if ((rateLimited || response.status >= 500) && attempt < MAX_RETRIES) {
				await sleep(Math.min(16000, 500 * 2 ** attempt) + Math.random() * 250, signal);
				continue;
			}
			throw new GmailError(detail.message || `Gmail returned an error (${response.status}).`, response.status, reason);
		}
	}

	function getProfile(signal) {
		return request('/profile', { signal });
	}

	/** Collects the IDs matching a query, stopping at `cap`. Spam and Trash are never included. */
	async function listIds(query, { cap = 5000, onProgress, signal } = {}) {
		const ids = new Set();
		let pageToken;
		let more = false;
		do {
			const page = await request('/messages', {
				params: { q: query, maxResults: LIST_PAGE_SIZE, pageToken, includeSpamTrash: 'false' },
				signal
			});
			for (const message of page.messages ?? []) {
				if (ids.size >= cap) {
					more = true;
					break;
				}
				if (MESSAGE_ID.test(message.id)) ids.add(message.id);
			}
			pageToken = page.nextPageToken;
			onProgress?.(ids.size);
			if (pageToken && ids.size >= cap) more = true;
		} while (pageToken && !more);
		return { ids: [...ids], truncated: more };
	}

	/** Fetches headers only (never the body) for a handful of messages, for the review table. */
	async function sample(ids, { concurrency = 6, onProgress, signal } = {}) {
		const results = new Array(ids.length);
		let done = 0;
		await pool(ids, concurrency, async (id, index) => {
			const message = await request(`/messages/${encodeURIComponent(id)}`, {
				params: { format: 'metadata', metadataHeaders: ['From', 'Subject'] },
				signal
			});
			const header = (name) => message.payload?.headers
				?.find((entry) => entry.name.toLowerCase() === name)?.value ?? '';
			results[index] = {
				id,
				from: header('from'),
				subject: header('subject'),
				date: Number(message.internalDate) || null,
				size: Number(message.sizeEstimate) || 0
			};
			onProgress?.(++done);
		});
		return results;
	}

	/**
	 * Adds/removes labels on many messages. Returns the IDs that were actually
	 * changed, including on failure (via error.doneIds), so undo stays exact.
	 */
	async function modify(ids, { add = [], remove = [] }, { onProgress, signal } = {}) {
		const doneIds = [];
		try {
			for (let start = 0; start < ids.length; start += BATCH_SIZE) {
				signal?.throwIfAborted();
				const chunk = ids.slice(start, start + BATCH_SIZE);
				try {
					await request('/messages/batchModify', {
						method: 'POST',
						body: { ids: chunk, addLabelIds: add, removeLabelIds: remove },
						signal
					});
					doneIds.push(...chunk);
					onProgress?.(doneIds.length);
				} catch (error) {
					const single = add.includes('TRASH') ? 'trash' : remove.includes('TRASH') ? 'untrash' : null;
					if (!(error instanceof GmailError) || error.status !== 400 || !single) throw error;
					// Batch refused the Trash label: fall back to the per-message endpoint.
					await pool(chunk, 5, async (id) => {
						await request(`/messages/${encodeURIComponent(id)}/${single}`, { method: 'POST', signal });
						doneIds.push(id);
						onProgress?.(doneIds.length);
					});
				}
			}
		} catch (error) {
			error.doneIds = doneIds;
			throw error;
		}
		return doneIds;
	}

	return { getProfile, listIds, sample, modify };
}

/** What each cleanup action does, and exactly how it is reversed. */
export const ACTIONS = {
	trash: {
		label: 'Move to Trash',
		past: 'moved to Trash',
		apply: { add: ['TRASH'] },
		revert: { remove: ['TRASH'] }
	},
	archive: {
		label: 'Archive',
		past: 'archived',
		apply: { remove: ['INBOX'] },
		revert: { add: ['INBOX'] }
	}
};
