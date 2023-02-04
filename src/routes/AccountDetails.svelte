<script lang="ts">
	import sanitize from 'sanitize-html';
	import FollowerAvatars from './FollowerAvatars.svelte';
	import type { Account } from '$lib/Account';

	export let account: Account;
	let emojis: string[][] = [];
	$: codes = extractEmojis(account.display_name);
	$: displayName = trimName(account.display_name, codes);

	function extractEmojis(displayName: string) {
		const SHORTCODE_REGEX = /:(.+?):/g;
		const matches = [...displayName.matchAll(SHORTCODE_REGEX)];
		const shortcodes = [...matches].map((m) => m[1]);
		for (const shortcode of shortcodes) {
			const emoji = account.emojis.find((e) => e.shortcode === shortcode);
			if (emoji?.url) {
				emojis.push([emoji.url, emoji.shortcode]);
			}
		}
		return shortcodes;
	}

	function trimName(name: string, codes: string[]): string {
		let displayName = name;
		for (const code of codes) {
			displayName = displayName.replace(`:${code}:`, '');
		}
		displayName = displayName.trim();
		return displayName;
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex truncate text-lg gap-0 flex-col">
		<p class="flex flex-shrink-0 items-center gap-2 truncate font-light text-accent-600">
			{#if displayName}
				<span class="inline-block">
					{displayName}
				</span>
			{/if}
			{#each emojis as [src, alt]}
				<img class="h-6 w-6" {src} alt={`Custom emoji with the shortcode ${alt}`} />
			{/each}
			{#if account.bot}
				<span title="Bot account" class="inline-block">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-px h-5 w-5 text-brand-900 opacity-60"
						viewBox="0 0 24 24"
						><path
							fill="currentColor"
							d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A.999.999 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1.004 1.004 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632zM7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2S7 13.104 7 12zm8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0l-.004 2zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2z"
						/></svg
					>
				</span>
			{/if}
			{#if account.locked}
				<span title="Following requires approval" class="inline-block">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-px h-5 w-5 text-brand-900 opacity-60"
						viewBox="0 0 24 24"
						><path
							fill="currentColor"
							d="M6 22q-.825 0-1.412-.587Q4 20.825 4 20V10q0-.825.588-1.413Q5.175 8 6 8h1V6q0-2.075 1.463-3.538Q9.925 1 12 1t3.538 1.462Q17 3.925 17 6v2h1q.825 0 1.413.587Q20 9.175 20 10v10q0 .825-.587 1.413Q18.825 22 18 22Zm6-5q.825 0 1.413-.587Q14 15.825 14 15q0-.825-.587-1.413Q12.825 13 12 13q-.825 0-1.412.587Q10 14.175 10 15q0 .825.588 1.413Q11.175 17 12 17ZM9 8h6V6q0-1.25-.875-2.125T12 3q-1.25 0-2.125.875T9 6Z"
						/></svg
					>
				</span>
			{/if}
		</p>
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
		<p
			class="text-base font-extralight opacity-65"
			title="total posts including replies and boosts"
		>
			<span class="font-light">{account.statuses_count}</span> posts since {new Date(
				account.created_at,
			).toLocaleDateString(undefined, {
				dateStyle: 'medium',
			})} • {(
				account.statuses_count /
				((new Date().getTime() - new Date(account.created_at).getTime()) / 1000 / 60 / 60 / 24)
			).toFixed(1)} posts per day
		</p>
	</div>
	{#if account.note}
		<p class="h-auto w-full text-base text-slate-900 opacity-85">{@html sanitize(account.note)}</p>
	{/if}
	<FollowerAvatars {account} />
</div>
