/**
 * Svelte action: reveals the section's .fade-in children once it scrolls into view.
 * Pairs with the .fade-in / .fade-in.visible transition in static/css/maximalist.css.
 */
export function reveal(node, options = { threshold: 0.1 }) {
	const observer = new IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) {
			node.querySelectorAll('.fade-in').forEach((el) => el.classList.add('visible'));
			observer.disconnect();
		}
	}, options);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
