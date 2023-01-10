<script lang="ts">
	export let errors: Record<string, string[]> = {};

	$: errorCount = Object.entries(errors).reduce((sum, [, errors]) => sum + errors.length, 0);
	let showErrors = false;
</script>

<section class="mt-8 space-y-2 text-sm">
	{#if errorCount > 0}
		<button on:click={() => (showErrors = !showErrors)} class="text-slate-800">
			<span class="font-bold">{errorCount} error{errorCount > 1 ? 's' : ''}</span> occurred while fetching
			data.
		</button>
	{/if}
	{#if showErrors}
		{#each Object.entries(errors) as [status, accts]}
			<p class="">
				<a
					target="_blank"
					rel="noreferrer"
					href={`https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${status}`}
					>{status} error</a
				>
				for {new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(accts)}
			</p>
		{/each}
	{/if}
</section>
