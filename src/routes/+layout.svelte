<script>
	import { onMount } from 'svelte';

	// Theme management
	let currentTheme = 'forest';
	const themes = ['forest', 'industrial', 'fantasy'];

	onMount(() => {
		// Load saved theme
		const savedTheme = localStorage.getItem('theme') || 'forest';
		currentTheme = savedTheme;
		if (savedTheme !== 'forest') {
			document.documentElement.setAttribute('data-theme', savedTheme);
		}
	});

	function toggleTheme() {
		const currentIndex = themes.indexOf(currentTheme);
		const nextIndex = (currentIndex + 1) % themes.length;
		currentTheme = themes[nextIndex];

		if (currentTheme === 'forest') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', currentTheme);
		}

		localStorage.setItem('theme', currentTheme);
	}
</script>

<svelte:head>
	<title>Andres Pineda | Software Engineer</title>
	<meta name="description" content="Software Engineer and Environmental Resources Engineering graduate from Humboldt State. Building sustainable solutions through code." />

	<!-- Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Nunito+Sans:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">

	<!-- Stylesheets -->
	<link rel="stylesheet" href="/css/themes/variables.css">
	<link rel="stylesheet" href="/css/base.css">
	<link rel="stylesheet" href="/css/components.css">
	<link rel="stylesheet" href="/css/themes/forest.css">
	<link rel="stylesheet" href="/css/themes/industrial.css">
	<link rel="stylesheet" href="/css/themes/fantasy.css">
	<link rel="stylesheet" href="/css/animations.css">
	<link rel="stylesheet" href="/css/responsive.css">
</svelte:head>

<!-- Background Effects - Redwoods Theme -->
<div class="forest-bg"></div>
<div class="rings-overlay"></div>
<div class="fog"></div>
<div class="particles">
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
	<div class="particle"></div>
</div>

<!-- Background Effects - Industrial Theme -->
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- Background Effects - Fantasy Theme -->
<div class="castle-bg"></div>
<div class="stonework-overlay"></div>

<!-- Theme Toggle Button -->
<button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
	<!-- Tree icon for Redwoods theme -->
	<svg class="icon-forest" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M12 2L4 12h3v8h10v-8h3L12 2zm0 3.5L16.5 11H15v7H9v-7H7.5L12 5.5z" />
	</svg>
	<!-- Circuit icon for Industrial theme -->
	<svg class="icon-industrial" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M7 2v2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3v2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3v2h2v-2h6v2h2v-2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-3v-2h3c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3V2h-2v2H9V2H7zm-3 4h16v4H4V6zm0 8h16v4H4v-4z" />
	</svg>
	<!-- Castle icon for Fantasy theme -->
	<svg class="icon-fantasy" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M4 2v6H2v14h20V8h-2V2H4zm2 2h2v2H6V4zm4 0h4v2h-4V4zm6 0h2v2h-2V4zM4 20v-10h16v10H4zm7-8h2v6h-2v-6z" />
	</svg>
</button>

<slot />
