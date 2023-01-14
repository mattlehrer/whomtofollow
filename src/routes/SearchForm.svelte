<script lang="ts">
	export let account: string;
	export let isLoading: boolean;

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;
</script>

<form class="max-w-2xl sm:px-4" on:submit>
	<label for="account" class="ml-px block pl-4 text-3xl font-medium text-brand-700 sm:text-4xl"
		>Your Fediverse Account:</label
	>
	<div class="mt-3">
		<input
			type="text"
			name="account"
			id="account"
			required
			pattern={AccountRegex.source}
			title="Please enter a valid account including the username, the @ symbol, and the host domain."
			bind:value={account}
			class="block w-full rounded-full border-slate-700 px-4 shadow-sm focus:border-brand-500 focus:ring-brand-500"
			placeholder="gargron@mastodon.social"
		/>
	</div>
	<button
		disabled={isLoading}
		type="submit"
		class="mt-6 inline-flex  items-center rounded-full border border-transparent bg-brand-600 px-4 py-2 text-lg font-medium text-brand-100 shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-25"
		>Find people you may know</button
	>
</form>
