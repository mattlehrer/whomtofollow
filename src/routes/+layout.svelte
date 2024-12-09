<script>
	import '../app.postcss';

	let { children } = $props();
</script>

<div class="min-h-full">
	{@render children?.()}
</div>

<style>
	:global(html, body) {
		@apply h-full bg-slate-200;
	}
</style>
