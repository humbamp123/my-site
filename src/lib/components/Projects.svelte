<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

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
					<h3 class="project-title">Concierge Bot Dashboard</h3>
					<p class="project-desc">AI-powered virtual assistant platform for hospitality. Deploy chatbots and voice agents across SMS, WhatsApp, and the web. Features 24/7 guest support and guest analytics.</p>
					<div class="project-tech">
						<span>TypeScript</span>
						<span>React</span>
						<span>Firebase</span>
					</div>
					<a href="https://www.concierge.bot/" target="_blank" rel="noopener noreferrer" class="project-link">
						Visit Site
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
