<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Account } from './Account';
	import { accountData } from './data';

	export let account: Account;

	const MAX_FOLLOWER_AVATARS = 10;

	$: followers = [...account.followed_by].map((f) => $accountData.get(f)).filter(isAccount);

	$: followersToShow =
		followers.length > MAX_FOLLOWER_AVATARS ? followers.slice(0, MAX_FOLLOWER_AVATARS) : followers;

	function isAccount(f: Account | undefined): f is Account {
		return Boolean(f) && typeof f === 'object' && 'acct' in f;
	}
	let showFollowers = false;
</script>

<button on:click={() => (showFollowers = !showFollowers)} class="mt-3 flex">
	<div class="flex-shrink-0">
		<div class="flex -space-x-1 overflow-hidden">
			{#each followersToShow as follower}
				<img
					class="inline-block h-8 w-8 rounded-full bg-white ring-2 ring-brand-50"
					src={follower?.avatar_static}
					loading="lazy"
					alt={`${follower?.display_name} | ${follower?.acct}`}
					title={`${follower?.display_name} | ${follower?.acct}`}
				/>
			{/each}
			{#if followers.length > MAX_FOLLOWER_AVATARS}
				<div
					class=" flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm text-accent-100 ring-2 ring-brand-50"
				>
					+{followers.length - MAX_FOLLOWER_AVATARS}
				</div>
			{/if}
		</div>
	</div>
</button>
{#if showFollowers}
	<div transition:slide class="mt-2  max-w-full text-sm">
		<p class="my-2 font-medium">
			You follow {followers.length.toLocaleString()} of {account.username}'s {account.followers_count.toLocaleString()}
			followers:
		</p>
		<p class="font-light">
			{#each followers as follower, i}
				<a class="hover:text-accent-700" target="_blank" rel="noreferrer" href={follower.url}
					>{follower.acct}</a
				>{i < followers.length - 1 ? ', ' : ''}{i === followers.length - 2 ? 'and ' : ''}
			{/each}
		</p>
	</div>
{/if}
