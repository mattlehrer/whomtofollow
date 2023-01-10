<script lang="ts">
	import sanitize from 'sanitize-html';
	import FollowerAvatars from './FollowerAvatars.svelte';
	import type { Account } from './Account';

	export let account: Account;
</script>

<div class="flex flex-col">
	<div class="flex flex-col truncate sm:text-lg">
		<p class="truncate font-light text-accent-600">{account.display_name}</p>
		<a
			target="_blank"
			rel="noreferrer"
			href={account.url}
			class="flex flex-shrink-0 items-center font-medium text-accent-600"
			>{account.acct}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="ml-1 h-4 w-4"
			>
				<path
					fill-rule="evenodd"
					d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
					clip-rule="evenodd"
				/>
				<path
					fill-rule="evenodd"
					d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
	</div>
	<div class="mt-2">
		<p class="h-auto w-full text-sm text-slate-900">{@html sanitize(account.note)}</p>
	</div>
	<FollowerAvatars {account} />
</div>

<style>
	:global(.virtual-scroll-item > article) {
		@apply border-b border-slate-900 border-opacity-25;
	}
</style>
