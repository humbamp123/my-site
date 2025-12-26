<script>
	import { base } from '$app/paths';

	function handleNavClick(e, href) {
		e.preventDefault();
		const target = document.querySelector(href);
		if (target) {
			target.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	}
</script>

<nav>
	<a href="{base}/" class="logo">
		<svg class="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 2L8 6v2l-4 4v10h16V12l-4-4V6l-4-4zm0 3l2 2v2.5l3 3V18H7v-5.5l3-3V7l2-2z" />
		</svg>
		Andres Pineda
	</a>
	<ul class="nav-links">
		<li><a href="#about" on:click={(e) => handleNavClick(e, '#about')}>About</a></li>
		<li><a href="#projects" on:click={(e) => handleNavClick(e, '#projects')}>Projects</a></li>
		<li><a href="#contact" on:click={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
		<li><a href="https://github.com/humbamp123" target="_blank">GitHub</a></li>
	</ul>
</nav>
