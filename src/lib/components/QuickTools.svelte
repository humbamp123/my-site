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

		const element = document.querySelector('#quick-tools');
		if (element) observer.observe(element);

		return () => observer.disconnect();
	});
</script>

<section id="quick-tools">
	<div class="container">
		<div class="section-header fade-in" class:visible>
			<div class="section-label">Tools</div>
			<h2 class="section-title">Quick Tools</h2>
		</div>

		<div class="tools-grid">
			<div class="tool-card tool-1 fade-in" class:visible>
				<div class="tool-icon">⚡</div>
				<div class="tool-number">Tool 01</div>
				<h3 class="tool-title">Wire Nut Calculator</h3>
				<p class="tool-desc">Interactive tool for electricians to find the right wire connector size. Select wire gauges and quantities to get recommendations from major brands.</p>
				<div class="tool-tech">
					<span>HTML</span>
					<span>CSS</span>
					<span>JavaScript</span>
				</div>
				<a href="{base}/wire-nuts/index.html" class="tool-link">
					Try It Live
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M7 17L17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			</div>

			<div class="tool-card tool-2 fade-in" class:visible>
				<div class="tool-icon">🍎</div>
				<div class="tool-number">Tool 02</div>
				<h3 class="tool-title">Calorie Counter</h3>
				<p class="tool-desc">Track your daily calorie intake with this simple and intuitive calorie counting tool. Monitor your nutrition and maintain a healthy lifestyle.</p>
				<div class="tool-tech">
					<span>HTML</span>
					<span>CSS</span>
					<span>JavaScript</span>
				</div>
				<a href="{base}/calorie-counter/index.html" class="tool-link">
					Try It Live
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M7 17L17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			</div>

			<div class="tool-card tool-3 fade-in" class:visible>
				<div class="tool-icon">🚲</div>
				<div class="tool-number">Tool 03</div>
				<h3 class="tool-title">Bike Rack Calculator</h3>
				<p class="tool-desc">Enter your bike's tire dimensions and get a custom cut list, to-scale drawing, and step-by-step instructions for a DIY swiveling wall-mounted bike rack.</p>
				<div class="tool-tech">
					<span>HTML</span>
					<span>CSS</span>
					<span>JavaScript</span>
				</div>
				<a href="{base}/bike-rack/index.html" class="tool-link">
					Try It Live
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M7 17L17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</section>
