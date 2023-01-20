<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import VirtualScroll from 'svelte-virtual-scroll-list';

	import type { PageData } from './$types';
	import type { Account } from '$lib/Account';
	import { accountData, errors, updateAccountData } from '$lib/data';
	import { fulfilledValues } from '$lib/utils/promises';
	import { getDomain } from '$lib/getDomain';
	import { getFollows } from '$lib/getFollows';
	import Errors from './Errors.svelte';
	import FollowSuggestion from './FollowSuggestion.svelte';
	import Footer from '$lib/Footer.svelte';
	import Hero from './Hero.svelte';
	import NoFollows from './NoFollows.svelte';
	import SuggestionsHeader from './SuggestionsHeader.svelte';

	export let data: PageData;

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;

	let account: string = data.account;
	let host: string;
	let isLoading = false;
	let noFollows = false;
	let dontSuggest: Set<string>;
	const sortOrder = writable<'default' | 'by-count'>('default');

	const phase1Progress = tweened(0, {
		duration: 5000,
		easing: cubicOut,
	});

	onMount(() => {
		dontSuggest = new Set();
	});

	// not sure of a better way to make the accountData map reactive
	const accountsYouMightFollow = derived(
		[accountData, updateAccountData, sortOrder],
		([$accountData]) => {
			let output = [...$accountData.entries()]
				.filter(([acct]) => !dontSuggest?.has(acct))
				.map((a) => a[1])
				.filter(
					(a) =>
						a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST &&
						a.followed_by.size / a.followers_count <= 1,
				);
			if ($sortOrder === 'by-count') {
				output.sort((a, b) => b.followed_by.size - a.followed_by.size);
			} else {
				output.sort(
					(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
				);
			}
			output = output.slice(0, 500);
			return output;
		},
	);

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;

	async function search() {
		if (!AccountRegex.test(account)) {
			return;
		}
		isLoading = true;
		noFollows = false;
		$phase1Progress = 20;
		// dontSuggest.clear();
		$accountData = new Map<string, Account>();

		try {
			dontSuggest = new Set<string>([account.replace(/^@/, '')]);
			const following = await getFollows(account, account, true, 2000);
			console.log(account, 'follows', following.length, 'accounts');

			if (!following.length) {
				noFollows = true;
			}

			for (const f of following) {
				dontSuggest.add(f.acct);
			}
			// save host for follow links
			host = await getDomain(account);

			// get 2nd level follows
			const followingPromises = following
				.sort(() => Math.random() - 0.5)
				.map((f) => trackProgress(getFollows(f.acct, account, false)));
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
	let pctDone = 0;
	$: if (progressNode && pendingFetches && dontSuggest.size) {
		pctDone = (80 * (dontSuggest.size - 1 - pendingFetches)) / (dontSuggest.size - 1);
	}
	$: if (pctDone || $phase1Progress)
		progressNode?.style?.setProperty('--progress', pctDone + $phase1Progress + '%');
</script>

<main class="pt-4 max-w-7xl mx-auto">
	{#if !$accountsYouMightFollow.length}
		<div class="flex h-full flex-col justify-between">
			<Hero bind:account bind:isLoading on:submit={search} />
			{#if noFollows}
				<NoFollows />
			{/if}
			<Footer />
		</div>
	{:else}
		<section>
			<VirtualScroll data={$accountsYouMightFollow} key="id" let:data>
				<div class="" slot="header">
					<Hero bind:account bind:isLoading on:submit={search} />
					<SuggestionsHeader bind:sortOrder={$sortOrder} />
				</div>

				<FollowSuggestion account={data} {host} />

				<div slot="footer">
					<div class="max-w-4xl p-4 sm:p-8 md:px-20">
						{#if Object.keys(errors).length}
							<Errors errors={$errors} />
						{/if}
					</div>
					<Footer />
				</div>
			</VirtualScroll>
		</section>
	{/if}
</main>
{#if isLoading}
	<div out:fade={{ duration: 2000 }} bind:this={progressNode} class="progress" />
{/if}

<style>
	main {
		height: 100dvh;
		min-height: 700px;
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
