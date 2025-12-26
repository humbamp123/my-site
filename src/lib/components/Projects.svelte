<script>
	import { onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visible = true;
					}
				});
			},
			{ threshold: 0.1 }
		);

		const element = document.querySelector('#projects');
		if (element) observer.observe(element);

		return () => observer.disconnect();
	});
</script>

<section id="projects">
	<div class="container">
		<div class="projects-header fade-in" class:visible>
			<div>
				<div class="section-label">Work</div>
				<h2 class="section-title">Featured Projects</h2>
			</div>
		</div>

		<div class="featured-projects">
			<div class="project-card featured fade-in" class:visible>
				<div class="project-info">
					<div class="project-number">Project 01</div>
					<h3 class="project-title">Wire Nut Calculator</h3>
					<p class="project-desc">Interactive tool for electricians to find the right wire connector size. Select wire gauges and quantities to get recommendations from major brands.</p>
					<div class="project-tech">
						<span>HTML</span>
						<span>CSS</span>
						<span>JavaScript</span>
					</div>
					<a href="/wire-nuts/index.html" class="project-link">
						Try It Live
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M7 17L17 7" />
							<path d="M7 7h10v10" />
						</svg>
					</a>
				</div>
				<div class="project-visual"></div>
			</div>

			<div class="project-card featured fade-in" class:visible>
				<div class="project-info">
					<div class="project-number">Project 02</div>
					<h3 class="project-title">Vectractor</h3>
					<p class="project-desc">A static web application for downloading Instagram videos, reels, and IGTV content with a modern, gradient-based interface. Features client-side processing for privacy protection.</p>
					<div class="project-tech">
						<span>HTML5</span>
						<span>CSS3</span>
						<span>JavaScript</span>
					</div>
					<a href="/Vectractor/index.html" class="project-link">
						Try It Live
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M7 17L17 7" />
							<path d="M7 7h10v10" />
						</svg>
					</a>
				</div>
				<div class="project-visual"></div>
			</div>
		</div>
	</div>
</section>
