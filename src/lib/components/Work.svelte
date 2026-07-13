<script>
	import { reveal } from '$lib/actions/revealOnScroll.js';
</script>

<section id="work" use:reveal>
	<div class="container">
		<div class="projects-header fade-in">
			<div>
				<div class="section-label">Work</div>
				<h2 class="section-title">Professional Experience</h2>
			</div>
		</div>

		<div class="featured-projects">
			<div class="project-card featured fade-in">
				<div class="project-info">
					<div class="project-number">Work 01</div>
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

			<div class="project-card featured fade-in">
				<div class="project-info">
					<div class="project-number">Work 02</div>
					<h3 class="project-title">Mayvenn</h3>
					<p class="project-desc">Full-stack e-commerce platform powering premium hair products and beauty services. Built event-driven microservices and integrated payments, CMS, shipping, and customer service systems.</p>
					<div class="project-tech">
						<span>Clojure</span>
						<span>ClojureScript</span>
						<span>React</span>
						<span>Stripe</span>
						<span>Contentful</span>
					</div>
					<a href="https://shop.mayvenn.com/" target="_blank" rel="noopener noreferrer" class="project-link">
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
