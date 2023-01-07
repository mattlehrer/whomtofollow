<script>
	import '../app.postcss';
</script>

<div class="min-h-full bg-slate-200">
	<slot />
</div>

<style>
	:global(html, body) {
		@apply h-full;
	}
</style>
