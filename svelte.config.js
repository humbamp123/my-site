import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
// Force rebuild to restore CSS styling
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/my-site' : ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore errors for submodules and other static files
				if (path.startsWith('/wire-nuts/') || path.endsWith('.png') || path.endsWith('.ico')) {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
