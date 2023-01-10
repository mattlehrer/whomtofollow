<script lang="ts">
	import sanitize from 'sanitize-html';
	import type { Account } from './Account';
	import { accountData } from './data';

	export let account: Account;
	export let host: string;

	const MAX_FOLLOWER_AVATARS = 10;

	const followers =
		account.followed_by.size > MAX_FOLLOWER_AVATARS
			? [...account.followed_by].sort(() => Math.random() - 0.5).slice(0, 4)
			: [...account.followed_by];
</script>

<article class="block max-w-3xl overflow-hidden hover:bg-brand-100 sm:mx-8 md:mx-16">
	<div class="flex flex-col items-start p-4 sm:mx-0 sm:flex-row sm:p-6">
		<div class="flex w-full items-center justify-between sm:items-start">
			<div class="flex-shrink-0">
				<img
					class="h-16 w-16 rounded-lg bg-white shadow sm:h-24 sm:w-24"
					loading="lazy"
					src={account.avatar_static}
					alt={account.display_name}
				/>
			</div>
			<div class="ml-4 hidden min-w-0 flex-1 sm:ml-6 sm:flex sm:items-center sm:justify-between">
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
					<!-- <div class="mt-2">
					<p class="text-sm text-slate-900">
						Followers: {Intl.NumberFormat(undefined, {
							notation: 'compact',
						}).format(account.followers_count)}
					</p>
				</div> -->
					<div class="mt-3 flex">
						<div class="flex-shrink-0">
							<div class="flex -space-x-1 overflow-hidden">
								{#each followers as f}
									{@const follower = $accountData?.get(f)}
									<img
										class="inline-block h-8 w-8 rounded-full bg-brand-50 ring-2 ring-brand-50"
										src={follower?.avatar_static}
										loading="lazy"
										alt={`${follower?.display_name} - ${follower?.acct}`}
										title={`${follower?.display_name} - ${follower?.acct}`}
									/>
								{/each}
								{#if account.followed_by.size > 4}
									<div
										class=" flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm text-accent-100 ring-2 ring-brand-50"
									>
										+{account.followed_by.size - 4}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="flex-shrink-0 sm:ml-5">
				<a
					href={`https://${host}/authorize_follow?acct=${account.acct}`}
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center rounded-full border border-transparent bg-accent-700 px-4 py-2 text-sm font-medium text-accent-50 shadow-sm hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
				>
					Follow
					<!-- <span class="hidden sm:inline">Follow</span> -->
					<!-- Heroicon name: mini/user-plus -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="ml-3 h-5 w-5 text-accent-100 sm:-mr-1"
					>
						<path
							d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z"
						/>
					</svg>
				</a>
			</div>
		</div>

		<div class="mt-3 min-w-0 flex-1 sm:hidden">
			<div class="">
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
				<!-- <div class="mt-2">
					<p class="text-sm text-slate-900">
						Followers: {Intl.NumberFormat(undefined, {
							notation: 'compact',
						}).format(account.followers_count)}
					</p>
				</div> -->
				<div class="mt-3 flex">
					<div class="flex-shrink-0">
						<div class="flex -space-x-1 overflow-hidden">
							{#each followers as f}
								{@const follower = $accountData?.get(f)}
								<img
									class="inline-block h-8 w-8 rounded-full bg-white ring-2 ring-brand-50"
									src={follower?.avatar_static}
									loading="lazy"
									alt={`${follower?.display_name} | ${follower?.acct}`}
									title={`${follower?.display_name} | ${follower?.acct}`}
								/>
							{/each}
							{#if account.followed_by.size > MAX_FOLLOWER_AVATARS}
								<div
									class=" flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm text-accent-100 ring-2 ring-brand-50"
								>
									+{account.followed_by.size - MAX_FOLLOWER_AVATARS}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</article>
