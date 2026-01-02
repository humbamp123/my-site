<script>
	import { base } from '$app/paths';

	let menuOpen = false;

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

<nav>
	<div class="container">
		<a href="{base}/" class="logo">
			<svg class="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2L8 6v2l-4 4v10h16V12l-4-4V6l-4-4zm0 3l2 2v2.5l3 3V18H7v-5.5l3-3V7l2-2z" />
			</svg>
			Andres Pineda
		</a>

		<!-- Hamburger Button (mobile only) -->
		<button class="hamburger" class:active={menuOpen} on:click={toggleMenu} aria-label="Toggle menu">
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
			<span class="hamburger-line"></span>
		</button>

		<!-- Desktop Nav Links -->
		<ul class="nav-links">
			<li><a href="#about" on:click={(e) => handleNavClick(e, '#about')}>About</a></li>
			<li><a href="#projects" on:click={(e) => handleNavClick(e, '#projects')}>Projects</a></li>
			<li><a href="#quick-tools" on:click={(e) => handleNavClick(e, '#quick-tools')}>Quick Tools</a></li>
			<li><a href="#contact" on:click={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
			<li><a href="https://github.com/humbamp123" target="_blank">GitHub</a></li>
		</ul>

		<!-- Mobile Menu Overlay -->
		<div class="mobile-menu" class:open={menuOpen}>
			<ul class="mobile-nav-links">
				<li><a href="#about" on:click={(e) => handleNavClick(e, '#about')}>About</a></li>
				<li><a href="#projects" on:click={(e) => handleNavClick(e, '#projects')}>Projects</a></li>
				<li><a href="#quick-tools" on:click={(e) => handleNavClick(e, '#quick-tools')}>Quick Tools</a></li>
				<li><a href="#contact" on:click={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
				<li><a href="https://github.com/humbamp123" target="_blank">GitHub</a></li>
			</ul>
		</div>
	</div>
</nav>
