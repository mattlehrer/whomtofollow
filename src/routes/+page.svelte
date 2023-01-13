<script lang="ts">
	import VirtualScroll from 'svelte-virtual-scroll-list';
	import { fade } from 'svelte/transition';
	import type { Account } from './Account';
	import Errors from './Errors.svelte';
	import { accountData } from './data';
	import FollowSuggestion from './FollowSuggestion.svelte';
	import type { PageData } from './$types';
	import Footer from '$lib/Footer.svelte';

	export let data: PageData;

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;
	const MAX_FOLLOWERS_TO_FETCH = 1000;

	let account: string = data.account;
	let host: string;
	let hosts = new Map<string, string>();
	let isLoading = false;
	let errors: Record<string, string[]> = {};
	let dontSuggest = new Set<string>();
	let count = 0;
	let accountsYouMightFollow: Account[] = [];

	// not sure of a better way to make the accountData map reactive
	$: if (count || !isLoading) {
		accountsYouMightFollow = [...$accountData.entries()]
			.filter(([acct]) => !dontSuggest.has(acct))
			.map((a) => a[1])
			.filter((a) => a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST)
			.sort(
				(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
			)
			.slice(0, 500);

		const somethingFishy = accountsYouMightFollow.filter(
			(a) => a.followed_by.size / a.followers_count > 1,
		);
		if (somethingFishy.length) {
			accountsYouMightFollow = accountsYouMightFollow.filter(
				(a) => a.followed_by.size / a.followers_count <= 1,
			);
		}
		// if (!isLoading) {
		// 	console.log('accountsYouMightFollow[0]', JSON.stringify(accountsYouMightFollow[0], null, 2));
		// 	console.log(
		// 		'followed_by',
		// 		JSON.stringify([...accountsYouMightFollow[0].followed_by], null, 2),
		// 	);
		// }
	}

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;

	async function getDomain(acct: string): Promise<string> {
		const server = acct.split('@')[1];
		if (hosts.has(server)) {
			// assume that all other users with the same domain are on the same server
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return hosts.get(server)!;
		}

		if ($accountData.has(acct)) {
			const account = $accountData.get(acct);
			if (account?.url) {
				const match = account.url.match(/^https?:\/\/([\w-]+(\.[\w-]+)+)/);
				if (match?.length === 3) {
					return match[1];
				}
			}
		}

		// check webfinger
		const match = acct.match(/^@?(.+)@(.+)$/);
		if (match?.length !== 3) {
			throw new Error(`Incorrect handle: ${acct}`);
		}
		const domain = match[2];

		try {
			const webfingerResp = await fetch(
				`https://${domain}/.well-known/webfinger?resource=acct:${acct}`,
			);
			const webfinger = await webfingerResp.json();
			const links = webfinger.links;
			type AcctLink = {
				rel: string;
				type: string;
				href: string;
			};
			const acctLink: AcctLink = links.find(
				(l: AcctLink) => l.rel === 'self' && l.type === 'application/activity+json',
			);
			if (!acctLink) {
				throw new Error(`No activity pub link for ${acct}`);
			}
			const acctUrl = new URL(acctLink.href);
			hosts.set(server, acctUrl.host);
			return acctUrl.host;
		} catch (error) {
			console.log('getDomain', error, acct);
		}
		try {
			const webfingerResp = await fetch(`/api/webfinger/${domain}/${acct}`);
			const acctLinkHref = await webfingerResp.text();
			const acctUrl = new URL(acctLinkHref);
			hosts.set(server, acctUrl.host);
			return acctUrl.host;
		} catch (error) {
			console.log('getDomain webfinger', error, acct);
		}
		throw new Error(`Error getting domain for ${acct}`);
	}

	async function getAccountInfo(acct: Account['acct'], force = false): Promise<Account> {
		if (!force && $accountData.has(acct)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return $accountData.get(acct)!;
		}
		let accountInfo: Account & { error?: string; error_description?: string };
		try {
			const domain = await getDomain(acct);
			let accountInfoRes = await fetch(`https://${domain}/api/v1/accounts/lookup?acct=${acct}`);
			if (!accountInfoRes.ok) {
				if (accountInfoRes.type === 'cors') {
					accountInfoRes = await fetch(`/api/acct/${acct}`);
				}
			}
			if (!accountInfoRes.ok) {
				throw new Error(accountInfoRes.statusText);
			}

			accountInfo = await accountInfoRes.json();
			// (Mastodon responds with "Record not found")
			if (accountInfo.error === "Can't find user") {
				// Pleroma error = "Can't find user"
				const nickname = acct.split('@')[0];
				const nonMastodonInfoRes = await fetch(`https://${domain}/api/v1/accounts/${nickname}`);
				accountInfo = await nonMastodonInfoRes.json();
			} else if (
				accountInfo.error_description ===
				// Friendica error_description = "The API endpoint is currently not implemented but might be in the future.
				'The API endpoint is currently not implemented but might be in the future.'
			) {
				console.log('Friendica');
				const nickname = acct.split('@')[0];
				const nonMastodonInfoRes = await fetch(`https://${domain}/api/v1/accounts/${nickname}`);
				accountInfo = await nonMastodonInfoRes.json();
			}

			while (accountInfo.moved) {
				accountInfo = await getAccountInfo(accountInfo.moved.acct);
			}
			$accountData.set(acct, { ...accountInfo, followed_by: new Set() });
			count++;
		} catch (e) {
			console.log({ e });
			throw new Error(`Error getting ${acct} info`);
		}
		return accountInfo;
	}

	async function getFollows(acct: Account['acct'], direct = true): Promise<Account[]> {
		if (!direct && acct === account) {
			return [];
		}
		const accountInfo = await getAccountInfo(acct);
		if (!accountInfo.id) {
			return [];
		}
		const domain = await getDomain(acct);

		let page:
			| string
			| undefined = `https://${domain}/api/v1/accounts/${accountInfo.id}/following?limit=80`;

		let follows: Account[] = [];
		while (page && follows.length < MAX_FOLLOWERS_TO_FETCH) {
			// const response = await fetch(page);
			let response;
			try {
				response = await fetch(page);
			} catch (e: unknown) {
				// console.log({ e });
				if (e instanceof Error) {
					console.log({ msg: e.message });
				} else {
					console.log({ msg: 'unknown error' }, e);
				}
				return follows;
			}

			if (!response?.ok) {
				// TODO: if cors error, try via server?
				// if 404, check webfinger, then request acct info to get correct account id
				// https://docs.joinmastodon.org/spec/webfinger/
				const status = String(response.status);
				if (errors[status]) {
					errors[status] = [...errors[status], acct];
				} else {
					errors[status] = [acct];
				}
				return follows;
			}
			const json = (await response.json()) as Account[];
			const newFollows = json.map((follow: Account) =>
				follow.acct && /.+@.+/.test(follow.acct)
					? follow
					: { ...follow, acct: `${follow.acct}@${domain}` },
			);
			follows = [...follows, ...newFollows];
			page = getNextPage(response.headers.get('Link') ?? undefined);
		}

		const followsPromises = follows.map((f) =>
			trackProgress(saveAcctInfo({ accountToSave: f, direct, followedBy: acct })),
		);
		await fulfilledValues(followsPromises);

		return follows;
	}

	async function saveAcctInfo({
		accountToSave,
		direct,
		followedBy,
	}: {
		accountToSave: Account;
		direct: boolean;
		followedBy: Account['acct'];
	}) {
		if ($accountData.has(accountToSave.acct)) {
			const account = $accountData.get(accountToSave.acct);
			if (!account) {
				throw new Error('account should exist');
			}
			$accountData.set(accountToSave.acct, {
				...account,
				acct: accountToSave.acct,
				followers_count: Math.max(account.followers_count, accountToSave.followers_count),
				followed_by: account.followed_by.add(followedBy),
			});
			count++;
		} else {
			if (!direct) {
				$accountData.set(accountToSave.acct, {
					...accountToSave,
					followed_by: new Set([followedBy]),
				});
				count++;
			} else {
				// different servers use different account IDs
				// if the account is a direct follow, we are going to need to do a follower lookup
				// on that acct's server. if the acct is on the same server, we're done.

				const fDomain = accountToSave.url.match(/https?:\/\/([^/]+)/)?.[1];
				const domain = await getDomain(followedBy);
				if (domain === fDomain) {
					$accountData.set(accountToSave.acct, {
						...accountToSave,
						followed_by: new Set([followedBy]),
					});
					count++;
				} else {
					try {
						const fInfo = await getAccountInfo(accountToSave.acct);
						$accountData.set(accountToSave.acct, { ...fInfo, followed_by: new Set([followedBy]) });
						count++;
					} catch (error) {
						console.log('Problem getting account info for', accountToSave.acct, error);
					}
				}
			}
		}
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

		try {
			const following = await getFollows(account);
			console.log(account, 'follows', following.length, 'accounts');

			// save host for follow links
			host = await getDomain(account);
			dontSuggest = new Set<string>([...following.map((f) => f.acct), account.replace(/^@/, '')]);

			// get 2nd level follows
			const followingPromises = following
				.sort(() => Math.random() - 0.5)
				.map((f) => trackProgress(getFollows(f.acct, false)));
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
		return Promise.allSettled(promises)
			.then((results) => {
				return results
					.filter((result) => result.status === 'fulfilled')
					.map((result) => (result as PromiseFulfilledResult<T>).value);
			})
			.catch((error) => {
				console.log({ error });
			});
	}

	let pendingFetches = 0;
	async function trackProgress<T>(p: Promise<T>): Promise<T> {
		pendingFetches++;
		return p.finally(() => {
			pendingFetches--;
		});
	}

	let progressNode: HTMLElement;
	$: if (progressNode && pendingFetches) {
		const pctDone = (100 * (dontSuggest.size - 1 - pendingFetches)) / (dontSuggest.size - 1);
		progressNode.style.setProperty('--progress', pctDone + '%');
	}
</script>

<svelte:head>
	<title>Whom to Follow | A Fediverse PYMK</title>
	<meta name="description" content="Find people to follow on the Fediverse" />
</svelte:head>

<main>
	{#if !accountsYouMightFollow.length}
		<div class="flex flex-col justify-between h-full">
			<div class="p-4 sm:p-8 md:p-16">
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
			<Footer />
		</div>
	{/if}
	{#if accountsYouMightFollow.length}
		<VirtualScroll data={accountsYouMightFollow} key="id" let:data>
			<div class="mt-4 p-4 pb-8 sm:p-8 md:p-16" slot="header">
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

			<FollowSuggestion account={data} {host} />

			<div slot="footer">
				<div class="max-w-4xl p-4 sm:p-8 md:px-16">
					{#if Object.keys(errors).length}
						<Errors {errors} />
					{/if}
				</div>
				<Footer />
			</div>
		</VirtualScroll>
	{/if}
</main>
{#if isLoading}
	<div out:fade={{ duration: 2000 }} bind:this={progressNode} class="progress" />
{/if}

<style>
	main {
		height: 100dvh;
		min-height: 500px;
	}

	.progress {
		display: block;
		width: 100%;
		height: 10px;
		position: fixed;
		z-index: 50;
		background: linear-gradient(to right, #0615ea var(--progress), transparent 0);
		background-repeat: no-repeat;
		top: 0;
		left: 0;
	}
</style>
