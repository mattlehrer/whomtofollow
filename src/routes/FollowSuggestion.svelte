<script lang="ts">
	import debounce from 'debounce';
	import AccountDetails from './AccountDetails.svelte';
	import type { Account } from '../lib/Account';
	import { Timeout } from '$lib/utils/timeout';

	export let account: Account;
	export let host: string;

	const domain = new URL(account.url).hostname;

	async function updateInfo() {
		try {
			const res = await fetch(`https://${domain}/api/v1/accounts/lookup?acct=${account.acct}`, {
				signal: Timeout(5000).signal,
			});
			const updatedAccount = await res.json();
			account.followers_count = updatedAccount.followers_count;
			account.id = updatedAccount.id;
		} catch (error) {
			console.debug(error);
		}
	}
</script>

<article
	class="mx-auto block max-w-7xl overflow-hidden"
	on:mouseenter={debounce(updateInfo, 100000, { immediate: true })}
>
	<div
		class="flex max-w-3xl flex-col items-start border-b border-slate-900 border-opacity-25 p-4 hover:bg-brand-100 sm:mx-4 md:mx-10 md:flex-row md:p-6"
	>
		<div class="flex w-full items-center justify-between md:items-start">
			<div class="flex-shrink-0">
				<img
					class="h-16 w-16 rounded-lg bg-white shadow md:h-24 md:w-24"
					loading="lazy"
					src={account.avatar_static}
					alt={account.display_name}
				/>
			</div>
			<div class="ml-4 hidden min-w-0 flex-1 md:ml-6 md:flex md:items-center md:justify-between">
				<AccountDetails {account} />
			</div>
			<div class="flex-shrink-0 md:ml-5">
				<a
					href={`https://${host}/authorize_follow?acct=${account.acct}`}
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center rounded-full border border-transparent bg-accent-700 px-4 py-2 text-sm font-medium text-accent-50 shadow-sm hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
				>
					Follow
					<!-- Heroicon name: mini/user-plus -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="ml-3 h-5 w-5 text-accent-100 md:-mr-1"
					>
						<path
							d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z"
						/>
					</svg>
				</a>
			</div>
		</div>

		<div class="mt-3 min-w-0 flex-1 md:hidden">
			<AccountDetails {account} />
		</div>
	</div>
</article>
