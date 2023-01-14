<script lang="ts">
	import SearchForm from './SearchForm.svelte';

	import VirtualScroll from 'svelte-virtual-scroll-list';
	import { fade } from 'svelte/transition';
	import type { Account } from '../lib/Account';
	import Errors from './Errors.svelte';
	import { accountData, updateAccountData } from '../lib/data';
	import FollowSuggestion from './FollowSuggestion.svelte';
	import type { PageData } from './$types';
	import Footer from '$lib/Footer.svelte';
	import { Timeout } from '$lib/utils/timeout';
	import { fulfilledValues } from '$lib/utils/promises';
	import { getDomain } from '$lib/getDomain';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import { getAccountInfo } from '$lib/getAccountInfo';
	import { saveAcctInfo } from '$lib/saveAccountInfo';

	export let data: PageData;

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;
	const MAX_FOLLOWERS_TO_FETCH = 1000;

	let account: string = data.account;
	let host: string;
	let isLoading = false;
	let errors: Record<string, string[]> = {};
	let dontSuggest: Set<string>;
	// let count = 0;

	onMount(() => {
		dontSuggest = new Set();
	});

	// not sure of a better way to make the accountData map reactive
	const accountsYouMightFollow = derived([accountData, updateAccountData], ([$accountData]) =>
		[...$accountData.entries()]
			.filter(([acct]) => !dontSuggest?.has(acct))
			.map((a) => a[1])
			.filter(
				(a) =>
					a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST &&
					a.followed_by.size / a.followers_count <= 1,
			)
			.sort(
				(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
			)
			.slice(0, 500),
	);

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;

	async function getFollows(acct: Account['acct'], direct = true): Promise<Account[]> {
		function getNextPage(linkHeader: string | undefined): string | undefined {
			if (!linkHeader) return;

			// https://docs.joinmastodon.org/api/guidelines/#pagination
			const match = linkHeader.match(/<(.+)>; rel="next"/);
			return match?.[1];
		}

		if (!direct && acct === account) {
			return [];
		}
		let accountInfo;
		try {
			accountInfo = await getAccountInfo(acct);
		} catch (error: any) {
			if (error?.status) {
				if (errors[error.status]) {
					errors[error.status] = [...errors[error.status], acct];
				} else {
					errors[error.status] = [acct];
				}
			}
			return [];
		}
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
				response = await fetch(page, {
					signal: Timeout(2000 * (direct ? 1 : 3)).signal,
				});
			} catch (e: unknown) {
				// console.log({ e });
				if (e instanceof Error) {
					console.debug({ msg: e.message });
				} else {
					console.debug(e);
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

	async function search() {
		if (!AccountRegex.test(account)) {
			return;
		}
		isLoading = true;
		// accountsYouMightFollow = [];
		dontSuggest.clear();
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

	let pendingFetches = 0;
	async function trackProgress<T>(p: Promise<T>): Promise<T> {
		pendingFetches++;
		return p.finally(() => {
			pendingFetches--;
		});
	}

	let progressNode: HTMLElement;
	$: if (progressNode && pendingFetches) {
		let pctDone: number;
		if (dontSuggest.size) {
			pctDone = (100 * (dontSuggest.size - 1 - pendingFetches)) / (dontSuggest.size - 1);
		} else {
			pctDone = 20 * ((1 - pendingFetches) / pendingFetches);
		}
		progressNode.style.setProperty('--progress', pctDone + '%');
	}
</script>

<svelte:head>
	<title>Whom to Follow | A Fediverse PYMK</title>
	<meta name="description" content="Find people to follow on the Fediverse" />
</svelte:head>

<main class="pt-4">
	{#if !$accountsYouMightFollow.length}
		<div class="flex h-full flex-col justify-between">
			<div class="p-4 sm:p-8 md:p-16">
				<SearchForm bind:account bind:isLoading on:submit={search} />
			</div>
			<Footer />
		</div>
	{:else}
		<VirtualScroll data={$accountsYouMightFollow} key="id" let:data>
			<div class="p-4 pb-8 sm:p-8 md:p-16" slot="header">
				<SearchForm bind:account bind:isLoading on:submit={search} />
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
