<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	import type { PageData } from './$types';
	import { AccountRegex, type Account } from '$lib/Account';
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
	import { SvelteSet } from 'svelte/reactivity';

	export let data: PageData;

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;

	let account: string = data.account;
	let host: string;
	let isLoading = false;
	let noFollows = false;
	let dontSuggest: SvelteSet<string>;
	let maxListSize = 75;
	let innerWidth = 400;
	const sortOrder = writable<'default' | 'by-count' | 'most-followers' | 'least-followers'>(
		'default',
	);

	const phase1Progress = new Tween(0, {
		duration: 5000,
		easing: cubicOut,
	});

	onMount(() => {
		dontSuggest = new SvelteSet();
		maxListSize = Math.floor(Math.min(innerWidth / 5, 75));
	});

	// not sure of a better way to make the accountData map reactive
	const accountsYouMightFollow = derived(
		[accountData, updateAccountData, sortOrder],
		([$accountData]) => {
			let output = [...$accountData.entries()]
				.filter(([acct]) => !dontSuggest?.has(acct.toLowerCase()))
				.map((a) => a[1])
				.filter((a) => a.followed_by.size / a.followers_count <= 1);

			if (output.length > maxListSize * 2) {
				let tmp = output.filter((a) => a.followed_by.size >= MIN_MUTUAL_FOLLOWS_TO_SUGGEST);
				if (tmp.length > 50) {
					output = tmp;
				}
			}
			if ($sortOrder === 'by-count') {
				output.sort((a, b) => b.followed_by.size - a.followed_by.size);
			} else if ($sortOrder === 'most-followers') {
				output.sort((a, b) => b.followers_count - a.followers_count);
			} else if ($sortOrder === 'least-followers') {
				output.sort((a, b) => a.followers_count - b.followers_count);
			} else {
				output.sort(
					(a, b) => b.followed_by.size / b.followers_count - a.followed_by.size / a.followers_count,
				);
			}
			output = output.slice(0, maxListSize);
			return output;
		},
	);

	async function search() {
		if (!AccountRegex.test(account)) {
			return;
		}
		isLoading = true;
		noFollows = false;
		phase1Progress.target = 20;
		// dontSuggest.clear();
		$accountData = new Map<string, Account>();

		try {
			const withoutAt = account.replace(/^@/, '').toLowerCase();
			dontSuggest = new SvelteSet<string>([withoutAt]);
			const following = await getFollows(withoutAt, withoutAt, true, 2000);
			console.log(withoutAt, 'follows', following.length, 'accounts');

			if (!following.length) {
				noFollows = true;
			}

			for (const f of following) {
				dontSuggest.add(f.acct.toLowerCase());
			}
			// save host for follow links
			host = await getDomain(withoutAt);

			// get 2nd level follows
			const followingPromises = following
				.sort(() => Math.random() - 0.5)
				.map((f) => trackProgress(getFollows(f.acct, withoutAt, false)));
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
	$: if (pctDone || phase1Progress.current)
		progressNode?.style?.setProperty('--progress', pctDone + phase1Progress.current + '%');
</script>

<svelte:window bind:innerWidth />

<main>
	{#if !$accountsYouMightFollow.length}
		<div class="mx-auto flex h-full max-w-7xl flex-col justify-between">
			<Hero bind:account bind:isLoading on:submit={search} />
			{#if noFollows}
				<NoFollows />
			{/if}
			<Footer />
		</div>
	{:else}
		<div class="mx-auto max-w-7xl">
			<Hero bind:account bind:isLoading on:submit={search} />
			<SuggestionsHeader bind:sortOrder={$sortOrder} />
		</div>
		{#each $accountsYouMightFollow as suggestion (suggestion.acct)}
			<FollowSuggestion account={suggestion} {host} />
		{/each}
		<div class="mx-auto max-w-7xl">
			<div class="max-w-4xl p-4 sm:p-8 md:px-20">
				{#if Object.keys(errors).length}
					<Errors errors={$errors} />
				{/if}
			</div>
			<Footer />
		</div>
	{/if}
</main>
{#if isLoading}
	<div out:fade={{ duration: 2000 }} bind:this={progressNode} class="progress"></div>
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
