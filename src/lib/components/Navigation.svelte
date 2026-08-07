<script>
	import { base } from '$app/paths';

	const sections = [
		{ href: '#about', label: 'About' },
		{ href: '#work', label: 'Work' },
		{ href: '#quick-tools', label: 'Quick Tools' },
		{ href: '#contact', label: 'Contact' }
	];

	let menuOpen = $state(false);

	function handleNavClick(e, href) {
		e.preventDefault();
		menuOpen = false;
		const target = document.querySelector(href);
		if (target) {
			target.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

{#snippet navItems()}
	{#each sections as { href, label }}
		<li><a {href} onclick={(e) => handleNavClick(e, href)}>{label}</a></li>
	{/each}
	<li><a href="https://github.com/humbamp123" target="_blank" rel="noopener noreferrer">GitHub</a></li>
{/snippet}

<nav>
	<div class="container">
		<a href="{base}/" class="logo">
			<svg class="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2L8 6v2l-4 4v10h16V12l-4-4V6l-4-4zm0 3l2 2v2.5l3 3V18H7v-5.5l3-3V7l2-2z" />
			</svg>
			Andres Pineda
		</a>

		<!-- Hamburger Button (mobile only) -->
		<button
			class="hamburger"
			class:active={menuOpen}
			onclick={toggleMenu}
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
		>
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
		</button>

		<!-- Desktop Nav Links -->
		<ul class="nav-links">
			{@render navItems()}
		</ul>

		<!-- Mobile Menu Overlay -->
		<div class="mobile-menu" class:open={menuOpen}>
			<ul class="mobile-nav-links">
				{@render navItems()}
			</ul>
		</div>
	</div>
</nav>
