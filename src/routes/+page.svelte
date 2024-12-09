<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { derived as derivedStore, writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	import type { PageData } from './$types';
	import { AccountRegex, type Account } from '$lib/Account';
	import { accountData, errors, updateAccountData } from '$lib/data.svelte';
	import { fulfilledValues } from '$lib/utils/promises';
	import { getDomain } from '$lib/getDomain';
	import { getFollows } from '$lib/getFollows';
	import Errors from './Errors.svelte';
	import FollowSuggestion from './FollowSuggestion.svelte';
	import Footer from '$lib/Footer.svelte';
	import Hero from './Hero.svelte';
	import NoFollows from './NoFollows.svelte';
	import SuggestionsHeader from './SuggestionsHeader.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	let {data}: {data:PageData} = $props();

	const MIN_MUTUAL_FOLLOWS_TO_SUGGEST = 3;

	let account: string = $state(data.account);
	let host: string = $state('');
	let isLoading = $state(false);
	let noFollows = $state(false);
	let dontSuggest: SvelteSet<string> = new SvelteSet();
	let maxListSize = $state(75);
	let innerWidth = $state(400);
	const sortOrder = writable<'default' | 'by-count' | 'most-followers' | 'least-followers'>(
		'default',
	);

	const phase1Progress = new Tween(0, {
		duration: 5000,
		easing: cubicOut,
	});

	$effect(() => {
		maxListSize = Math.floor(Math.max(innerWidth / 5, 75));
	});

	let pendingFetches = $state(0);
	let progressNode: HTMLElement | null = $state(null);
	const pctDone = $derived(dontSuggest ? (80 * (dontSuggest.size - 1 - pendingFetches)) / (dontSuggest.size - 1) : 0);
	$effect(() => {
		progressNode?.style?.setProperty('--progress', pctDone + phase1Progress.current + '%');
	});

	// not sure of a better way to make the accountData map reactive
	const accountsYouMightFollow = $derived.by(() => {
			let output = [...accountData.entries()]
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
			return output.slice(0, maxListSize);}
	);

	async function search() {
		if (!AccountRegex.test(account)) {
			return;
		}
		isLoading = true;
		noFollows = false;
		phase1Progress.target = 20;
		// dontSuggest.clear();
		accountData.clear();

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

	async function trackProgress<T>(p: Promise<T>): Promise<T> {
		pendingFetches++;
		return p.finally(() => {
			pendingFetches--;
		});
	}


</script>

<svelte:window bind:innerWidth />

<main>
	{#if !accountsYouMightFollow.length}
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
		{#each accountsYouMightFollow as suggestion (suggestion.acct)}
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
