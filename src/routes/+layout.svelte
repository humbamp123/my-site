<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Andres Pineda | Software Engineer</title>
	<meta name="description" content="Software Engineer and Environmental Resources Engineering graduate from Humboldt State. Building sustainable solutions through code." />

	<!-- Fonts: Fraunces for quirky display, Outfit for secondary, Lora for body -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,400&family=Outfit:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">

	<!-- Maximalist Desert Bazaar theme -->
	<link rel="stylesheet" href="{base}/css/maximalist.css">
</svelte:head>

<!-- Maximalist Chaotic Background -->
<div class="chaos-bg">
	<!-- Base gradient layer -->
	<div class="base-gradient"></div>

	<!-- Dot pattern layer -->
	<div class="dot-pattern"></div>

	<!-- Zigzag pattern layer -->
	<div class="zigzag-layer"></div>

	<!-- Decorative shapes -->
	<div class="deco-shapes">
		<div class="shape arch arch-1"></div>
		<div class="shape arch arch-2"></div>
		<div class="shape circle circle-1"></div>
		<div class="shape circle circle-2"></div>
		<div class="shape circle circle-3"></div>
		<div class="shape sunburst"></div>
		<div class="shape wave wave-1"></div>
		<div class="shape wave wave-2"></div>
	</div>

	<!-- Corner decorations -->
	<div class="corner-deco top-left"></div>
	<div class="corner-deco top-right"></div>
	<div class="corner-deco bottom-left"></div>
	<div class="corner-deco bottom-right"></div>

	<!-- Grain texture overlay -->
	<div class="grain"></div>
</div>

<slot />
