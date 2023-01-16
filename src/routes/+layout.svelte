<script>
	import '../app.postcss';
</script>

<div class="min-h-full">
	<slot />
</div>

<style>
	:global(html, body) {
		@apply h-full bg-slate-200;
	}
</style>
