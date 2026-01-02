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
				<div class="section-label">Projects</div>
				<h2 class="section-title">Personal Projects</h2>
			</div>
		</div>

		<div class="featured-projects">
			<div class="project-card fade-in" class:visible>
				<div class="project-info">
					<div class="project-number">Project 01</div>
					<h3 class="project-title">Custom Vibe</h3>
					<p class="project-desc">Android app that lets users set custom vibration patterns for different app notifications. Personalize how your phone alerts you based on the app.</p>
					<div class="project-tech">
						<span>React Native</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
