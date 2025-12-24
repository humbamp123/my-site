<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let scrolled = 0;

	onMount(() => {
		if (!browser) return;
		const handleScroll = () => {
			scrolled = window.pageYOffset;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function handleScrollClick(e, href) {
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

<section id="hero">
	<div class="container">
		<div class="hero-content">
			<div class="hero-text">
				<div class="hero-location">
					<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
					</svg>
					San Francisco Bay Area
				</div>
				<h1 class="hero-title">
					<span class="name">Andres Pineda</span>
					<span class="role">Software Engineer</span>
				</h1>
				<p class="hero-desc">
					Rooted in <strong>Environmental Resources Engineering</strong> from Humboldt State, now
					building sustainable software solutions. Where the redwoods meet the code.
				</p>
				<div class="hero-cta">
					<a href="#projects" class="btn btn-primary" on:click={(e) => handleScrollClick(e, '#projects')}>
						Explore Work
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</a>
					<a href="#contact" class="btn btn-secondary" on:click={(e) => handleScrollClick(e, '#contact')}>Get in Touch</a>
				</div>
			</div>
			<div class="hero-visual">
				<!-- Redwoods Theme Hero -->
				<div class="tree-illustration" style="transform: translateY({browser && scrolled < window.innerHeight ? scrolled * 0.15 : 0}px)">
					<div class="canopy">
						<div class="branch"></div>
						<div class="branch"></div>
						<div class="branch"></div>
					</div>
					<div class="tree-trunk"></div>
					<div class="tree-rings">
						<div class="ring"></div>
						<div class="ring"></div>
						<div class="ring"></div>
						<div class="ring"></div>
					</div>
				</div>
				<!-- Industrial Theme Hero -->
				<div class="hero-graphic-industrial" style="transform: translateY({browser && scrolled < window.innerHeight ? scrolled * 0.2 : 0}px)">
					<div class="orbit">
						<div class="orbit-dot"></div>
					</div>
					<div class="orbit">
						<div class="orbit-dot"></div>
					</div>
					<div class="orbit">
						<div class="orbit-dot"></div>
					</div>
					<div class="center-element">
						&lt; /&gt;
					</div>
				</div>
				<!-- Fantasy Theme Hero -->
				<div class="castle-illustration" style="transform: translateY({browser && scrolled < window.innerHeight ? scrolled * 0.12 : 0}px)">
					<div class="castle-tower-left">
						<div class="castle-battlement"></div>
					</div>
					<div class="castle-tower-main">
						<div class="castle-battlement"></div>
						<div class="castle-window"></div>
						<div class="castle-flag">
							<div class="flag-pole"></div>
							<div class="flag-banner"></div>
						</div>
					</div>
					<div class="castle-tower-right">
						<div class="castle-battlement"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="scroll-indicator">
		<span>Scroll</span>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 5v14" />
			<path d="m19 12-7 7-7-7" />
		</svg>
	</div>
</section>
