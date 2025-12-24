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

		const element = document.querySelector('#about');
		if (element) observer.observe(element);

		return () => observer.disconnect();
	});
</script>

<section id="about">
	<div class="container">
		<div class="about-grid">
			<div class="about-left fade-in" class:visible>
				<div class="section-label">About</div>
				<h2 class="section-title">Rooted in engineering,<br>growing through code.</h2>
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-number">22+</div>
						<div class="stat-label">Public Repos</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">8+</div>
						<div class="stat-label">Years Coding</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">6+</div>
						<div class="stat-label">Languages</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">Cal Poly</div>
						<div class="stat-label">Humboldt Alumni</div>
					</div>
				</div>
			</div>
			<div class="about-right fade-in" class:visible>
				<div class="about-text">
					<p>I'm a Software Engineer with an unconventional path&mdash;bridging <span class="about-highlight">Environmental Resources Engineering</span> with modern software development.</p>
					<p>My time at Humboldt State, surrounded by ancient redwoods and wild rivers, taught me to think in systems. Whether it's water flow dynamics or data pipelines, the principles remain: understand the whole, optimize for sustainability, build for resilience.</p>
					<p>Currently at Qlik/Stitch Data, I specialize in building robust data systems and full-stack applications. I'm also a graduate of 42 School, where I sharpened my skills in C programming and algorithmic thinking.</p>
				</div>
				<div class="skills-section">
					<h3 class="skills-title">Technologies & Tools</h3>
					<div class="skills-grid">
						<span class="skill-tag">TypeScript</span>
						<span class="skill-tag">JavaScript</span>
						<span class="skill-tag">C / C++</span>
						<span class="skill-tag">Clojure</span>
						<span class="skill-tag">Ruby</span>
						<span class="skill-tag">React</span>
						<span class="skill-tag">Angular</span>
						<span class="skill-tag">Node.js</span>
						<span class="skill-tag">Docker</span>
						<span class="skill-tag">Kafka</span>
						<span class="skill-tag">PostgreSQL</span>
						<span class="skill-tag">Git</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
