<script lang="ts">
	import VirtualScroll from 'svelte-virtual-scroll-list';
	import type { Account } from './Account';
	import { accountData } from './data';
	import FollowSuggestion from './FollowSuggestion.svelte';

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;
	const MAX_FOLLOWERS_TO_FETCH = 1000;

	let account: string;
	let host: string;
	let isLoading = false;
	let errors: string[] = [];
	let dontSuggest = new Set<string>();
	let count = 0;
	let accountsYouMightFollow: Account[] = [];

	// not sure of a better way to make the accountData map reactive
	$: if (count)
		accountsYouMightFollow = [...$accountData.entries()]
			.filter(([acct]) => !dontSuggest.has(acct))
			.map((a) => a[1])
			.filter((a) => a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST)
			.sort(
				(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
			)
			.slice(0, 500);

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;

	function getDomain(acct: string) {
		const match = acct.match(/^@?(.+)@(.+)$/);
		if (match?.length !== 3) {
			throw new Error(`Incorrect handle: ${acct}`);
		}
		const domain = match[2];
		return domain;
	}

	async function getAccountInfo(acct: Account['acct']): Promise<Account> {
		if ($accountData.has(acct)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return $accountData.get(acct)!;
		}
		const domain = getDomain(acct);
		let accountInfo: Account;
		try {
			let accountInfoRes = await fetch(`https://${domain}/api/v1/accounts/lookup?acct=${acct}`);

			if (!accountInfoRes.ok) {
				if (accountInfoRes.status === 404 && accountInfoRes.type === 'cors') {
					accountInfoRes = await fetch(`/api/acct/${acct}`);
				}
			}
			if (!accountInfoRes.ok) {
				throw new Error(accountInfoRes.statusText);
			}

			accountInfo = await accountInfoRes.json();

			while (accountInfo.moved) {
				accountInfo = await getAccountInfo(accountInfo.moved.acct);
			}
			$accountData.set(acct, { ...accountInfo, followed_by: new Set() });
		} catch (e) {
			console.log({ e });
			throw new Error(`Error getting ${acct} info`);
		}
		return accountInfo;
	}

	async function getFollows(acct: Account['acct']): Promise<Account[]> {
		const domain = getDomain(acct);
		const accountInfo = await getAccountInfo(acct);
		if (!accountInfo.id) {
			return [];
		}

		let page:
			| string
			| undefined = `https://${domain}/api/v1/accounts/${accountInfo.id}/following?limit=80`;

		let follows: Account[] = [];
		while (page && follows.length < MAX_FOLLOWERS_TO_FETCH) {
			const response = await fetch(page);

			if (!response.ok) {
				// TODO: if cors error, try via server?
				errors = [`Error getting ${acct}'s follows'`, ...errors];
				return follows;
			}
			const json = (await response.json()) as Account[];
			const newFollows = json.map((follow: Account) =>
				follow.acct && /@/.test(follow.acct)
					? follow
					: { ...follow, acct: `${follow.acct}@${domain}` },
			);
			follows = [...follows, ...newFollows];
			page = getNextPage(response.headers.get('Link') ?? undefined);
		}
		for (const f of follows) {
			if ($accountData.has(f.acct)) {
				$accountData.get(f.acct)?.followed_by.add(acct);
			} else {
				if (!f.id.match(/^[0-9]+$/)) {
					// not a mastodon ID, likely pleroma, try finding the mastodon ID in the avatar S3 URL
					const match = f.avatar.match(/accounts\/avatars\/([0-9/]+)\/original/);
					if (match) {
						f.id = match[1].replaceAll('/', '');
					}
				}
				$accountData.set(f.acct, { ...f, followed_by: new Set([acct]) });
			}
			count++;
		}
		return follows;
	}

	async function search() {
		if (!AccountRegex.test(account)) {
			return;
		}
		isLoading = true;
		dontSuggest = new Set<string>();
		accountsYouMightFollow = [];
		count = 0;
		// TODO: reuse cache of account data
		$accountData = new Map<string, Account>();

		// save host for follow links
		host = getDomain(account);

		try {
			const following = await getFollows(account);
			dontSuggest = new Set<string>([...following.map((f) => f.acct), account.replace(/^@/, '')]);

			// get 2nd level follows
			const followingPromises = following
				.sort(() => Math.random() - 0.5)
				.map((f) => getFollows(f.acct));
			await fulfilledValues(followingPromises);
		} catch (error) {
			console.log({ error });
		}
		isLoading = false;
	}

	function getNextPage(linkHeader: string | undefined): string | undefined {
		if (!linkHeader) return;

		// https://docs.joinmastodon.org/api/guidelines/#pagination
		const match = linkHeader.match(/<(.+)>; rel="next"/);
		return match?.[1];
	}

	async function fulfilledValues<T>(promises: Promise<T>[]) {
		return Promise.allSettled(promises).then((results) => {
			return results
				.filter((result) => result.status === 'fulfilled')
				.map((result) => (result as PromiseFulfilledResult<T>).value);
		});
	}
</script>

<svelte:head>
	<title>Whom to Follow | A Fediverse PYMK</title>
	<meta name="description" content="Find people to follow on the Fediverse" />
</svelte:head>

<main>
	{#if !accountsYouMightFollow.length}
		<div class="mt-4 p-4 sm:p-8 md:p-16">
			<form class="max-w-2xl sm:px-4" on:submit={search}>
				<label
					for="account"
					class="ml-px block pl-4 text-3xl font-medium text-brand-700 sm:text-4xl"
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
					on:click|preventDefault={search}
					disabled={isLoading}
					type="button"
					class="mt-6 inline-flex  items-center rounded-full border border-transparent bg-brand-600 px-4 py-2 text-lg font-medium text-brand-100 shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-25"
					>Find people you may know</button
				>
			</form>
		</div>
	{/if}
	{#if accountsYouMightFollow.length}
		<VirtualScroll data={accountsYouMightFollow} key="id" let:data>
			<div class="mt-4 p-4 pb-8 sm:p-8 md:p-16" slot="header">
				{#if accountsYouMightFollow.length}
					<!-- <div class="sm:p-8 md:p-16"> -->
					<form class="max-w-2xl sm:px-4" on:submit={search}>
						<label
							for="account"
							class="ml-px block pl-4 text-3xl font-medium text-brand-700 sm:text-4xl"
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
							on:click|preventDefault={search}
							disabled={isLoading}
							type="button"
							class="mt-6 inline-flex  items-center rounded-full border border-transparent bg-brand-600 px-4 py-2 text-lg font-medium text-brand-100 shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-25"
							>Find people you may know</button
						>
					</form>
					<!-- </div> -->
				{/if}
			</div>

			<FollowSuggestion account={data} {host} />

			<div class="max-w-4xl p-4 sm:p-8 md:p-16" slot="footer">
				{#if errors.length}
					<div class="mt-8">
						{JSON.stringify(errors)}
					</div>
				{/if}
			</div>
		</VirtualScroll>
	{/if}
</main>

<style>
	main {
		height: 100dvh;
		min-height: 500px;
	}
</style>
