<script lang="ts">
	import type { Account } from './Account';

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;
	const MAX_FOLLOWERS_TO_FETCH = 5000;

	let account = 'mattlehrer@mastodon.social';
	let host: string;
	let isLoading = false;
	let errors: string[] = [];
	const accountData = new Map<string, Account>();
	let dontSuggest = new Set<string>();
	let count = 0;
	let accountsYouMightFollow: Account[] = [];
	$: if (count)
		accountsYouMightFollow = [...accountData.entries()]
			.filter(([acct]) => !dontSuggest.has(acct))
			.filter(([, a]) => a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST)
			.map((a) => a[1])
			.sort(
				(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
			);

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
		if (accountData.has(acct)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return accountData.get(acct)!;
		}
		const domain = getDomain(acct);
		let accountInfo: Account;
		try {
			const accountInfoRes = await fetch(`https://${domain}/api/v1/accounts/lookup?acct=${acct}`);
			accountInfo = await accountInfoRes.json();

			while (accountInfo.moved) {
				accountInfo = await getAccountInfo(accountInfo.moved.acct);
			}
			accountData.set(acct, { ...accountInfo, followed_by: new Set() });
		} catch (e) {
			console.log({ e });
			throw new Error(`Error getting ${acct} info`);
		}
		return accountInfo;
	}

	async function getFollows(acct: Account['acct']): Promise<Account[]> {
		const domain = getDomain(acct);
		const accountInfo = await getAccountInfo(acct);
		if (!accountInfo) {
			return [];
		}
		if (!accountInfo.discoverable) {
			// errors = [`Account ${acct} is not discoverable`, ...errors];
			console.log(`Account ${acct} has opted out of discovery.`);
			return [];
		}

		let page:
			| string
			| null = `https://${domain}/api/v1/accounts/${accountInfo.id}/following?limit=80`;

		let follows: Account[] = [];
		while (page && follows.length < MAX_FOLLOWERS_TO_FETCH) {
			const response = await fetch(page);

			if (!response.ok) {
				errors = [`Error getting ${acct}'s follows'`, ...errors];
			}
			const json = (await response.json()) as Account[];
			const newFollows = json.map((follow: Account) =>
				follow.acct && /@/.test(follow.acct)
					? follow
					: { ...follow, acct: `${follow.acct}@${domain}` },
			);
			follows = [...follows, ...newFollows];
			page = getNextPage(response.headers.get('Link'));
		}
		for (const f of follows) {
			if (accountData.has(f.acct)) {
				accountData.get(f.acct)?.followed_by.add(acct);
			} else {
				accountData.set(f.acct, { ...f, followed_by: new Set([acct]) });
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

		// save host for follow links
		host = getDomain(account);

		const following = await getFollows(account);
		dontSuggest = new Set<string>([...following.map((f) => f.acct), account.replace(/^@/, '')]);

		// get 2nd level follows
		const followingPromises = following.map((f) => getFollows(f.acct));
		await fulfilledValues(followingPromises);
		isLoading = false;
	}

	function getNextPage(linkHeader: string | null): string | null {
		if (!linkHeader) {
			return null;
		}
		// https://docs.joinmastodon.org/api/guidelines/#pagination
		const match = linkHeader.match(/<(.+)>; rel="next"/);
		return match?.[1] ?? null;
	}

	async function fulfilledValues<T>(promises: Promise<T>[]) {
		return Promise.allSettled(promises).then((results) => {
			return results
				.filter((result) => result.status === 'fulfilled')
				.map((result) => (result as PromiseFulfilledResult<T>).value);
		});
	}
</script>

<main class="">
	<form class="max-w-2xl px-4 pt-8 sm:p-16">
		<label for="account" class="ml-px block pl-4 text-3xl sm:text-4xl font-medium text-brand-700"
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
			class="mt-6 border-transparent text-white inline-flex items-center rounded-full border bg-brand-600 px-4 py-2 text-lg font-medium shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-brand-100 disabled:opacity-25"
			>Find people you may know</button
		>
	</form>

	<div class="my-8">
		<!-- {accountsYouMightFollow.length} -->
		<ul>
			{#each accountsYouMightFollow as account}
				<li>
					{account.acct} - {[...account.followed_by].join(', ')} - followers: {account.followers_count}
				</li>
			{/each}
		</ul>
	</div>
	<div class="mt-8">
		{JSON.stringify(errors)}
	</div>
</main>
