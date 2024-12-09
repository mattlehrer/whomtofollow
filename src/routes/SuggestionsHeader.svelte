<script lang="ts">
	import { clickoutside } from '@svelte-put/clickoutside';

	interface Props {
		sortOrder?: 'default' | 'by-count' | 'most-followers' | 'least-followers';
	}

	let { sortOrder = $bindable('default') }: Props = $props();

	let isSettingsOpen = $state(false);
</script>

<div class="flex max-w-3xl items-center justify-between px-4 pb-4 pt-3 sm:mx-4 md:mx-10 md:px-6">
	<h2 class="text-lg sm:text-xl">Some new accounts you might like</h2>
	<div class="relative inline-block text-left">
		<div>
			<button
				type="button"
				class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-brand-100"
				id="sort-order-menu-button"
				aria-label="Sort Order Options"
				aria-expanded={isSettingsOpen}
				aria-haspopup="true"
				onclick={(e) => {
					e.stopPropagation();
					isSettingsOpen = !isSettingsOpen;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-6 w-6"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
					/>
				</svg>
			</button>
		</div>

		{#if isSettingsOpen}
			<div
				class="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white p-4 shadow-lg ring-1 ring-black/5 focus:outline-none"
				role="menu"
				aria-orientation="vertical"
				aria-labelledby="sort-order-menu-button"
				use:clickoutside
				onclickoutside={() => (isSettingsOpen = false)}
			>
				<div class="py-1" role="none">
					<p class="mb-2 w-full text-center">Sort Order Options</p>
					<fieldset aria-label="Sort order">
						<div class="space-y-4">
							<!-- Active: "border-indigo-600 ring-2 ring-indigo-600", Not Active: "border-gray-300" -->
							<label
								aria-label="default"
								class="relative block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-brand-100 focus:outline-none sm:flex sm:justify-between"
							>
								<input
									type="radio"
									name="sort-order"
									value="default"
									bind:group={sortOrder}
									class="sr-only"
								/>
								<span class="flex items-center">
									<span class="flex flex-col text-sm">
										<span class="font-medium text-gray-900">Percentage of Followers You Follow</span
										>
										<span class="text-gray-500">Prefers smaller accounts</span>
									</span>
								</span>
								<span
									class="pointer-events-none absolute -inset-px rounded-lg border-2 {sortOrder ===
									'default'
										? 'border-brand-600'
										: 'border-transparent'}"
									aria-hidden="true"
								></span>
							</label>
							<label
								aria-label="by-count"
								class="relative block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-brand-100 focus:outline-none active:border-brand-600 active:ring-brand-600 sm:flex sm:justify-between"
							>
								<input
									type="radio"
									name="sort-order"
									value="by-count"
									bind:group={sortOrder}
									class="sr-only"
								/>
								<span class="flex items-center">
									<span class="flex flex-col text-sm">
										<span class="font-medium text-gray-900">Most Followers You Follow</span>
										<span class="text-gray-500">Prefers larger accounts</span>
									</span>
								</span>
								<span
									class="pointer-events-none absolute -inset-px rounded-lg border-2 {sortOrder ===
									'by-count'
										? 'border-brand-600'
										: 'border-transparent'}"
									aria-hidden="true"
								></span>
							</label>
							<label
								aria-label="most-followers"
								class="relative block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-brand-100 focus:outline-none active:border-brand-600 active:ring-brand-600 sm:flex sm:justify-between"
							>
								<input
									type="radio"
									name="sort-order"
									value="most-followers"
									bind:group={sortOrder}
									class="sr-only"
								/>
								<span class="flex items-center">
									<span class="flex flex-col text-sm">
										<span class="font-medium text-gray-900">Most Followers</span>
										<span class="text-gray-500">Absolute largest accounts</span>
									</span>
								</span>
								<span
									class="pointer-events-none absolute -inset-px rounded-lg border-2 {sortOrder ===
									'most-followers'
										? 'border-brand-600'
										: 'border-transparent'}"
									aria-hidden="true"
								></span>
							</label>
							<label
								aria-label="least-followers"
								class="relative block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-brand-100 focus:outline-none active:border-brand-600 active:ring-brand-600 sm:flex sm:justify-between"
							>
								<input
									type="radio"
									name="sort-order"
									value="least-followers"
									bind:group={sortOrder}
									class="sr-only"
								/>
								<span class="flex items-center">
									<span class="flex flex-col text-sm">
										<span class="font-medium text-gray-900">Fewest Followers</span>
										<span class="text-gray-500">Absolute smallest accounts</span>
									</span>
								</span>
								<span
									class="pointer-events-none absolute -inset-px rounded-lg border-2 {sortOrder ===
									'least-followers'
										? 'border-brand-600'
										: 'border-transparent'}"
									aria-hidden="true"
								></span>
							</label>
						</div>
					</fieldset>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
</style>
