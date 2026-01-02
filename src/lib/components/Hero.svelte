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
						<span>View Work</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</a>
					<a href="#contact" class="btn btn-secondary" on:click={(e) => handleScrollClick(e, '#contact')}>Contact</a>
				</div>
			</div>
			<div class="hero-visual">
				<!-- Golden Gate Bridge -->
				<div class="golden-gate">
					<div class="gate-sun"></div>
					<div class="gate-tower gate-tower-left"></div>
					<div class="gate-tower gate-tower-right"></div>
					<div class="gate-cable"></div>
					<div class="gate-suspenders"></div>
					<div class="gate-deck"></div>
					<div class="gate-water"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="scroll-indicator">
		<span>Scroll</span>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">
			<path d="M12 5v14" />
			<path d="m19 12-7 7-7-7" />
		</svg>
	</div>
</section>
