<script lang="ts">
	import {
		Popover,
		PopoverButton,
		PopoverPanel,
		RadioGroup,
		RadioGroupLabel,
		RadioGroupOption,
	} from '@rgossiaux/svelte-headlessui';

	export let sortOrder: 'default' | 'by-count' = 'default';
</script>

<div class="flex max-w-3xl items-center justify-between px-4 pt-3 pb-4  sm:mx-8 sm:px-6 md:mx-10">
	<h2 class="text-lg sm:text-xl">Some new accounts you might like</h2>
	<Popover style="position: relative;">
		<PopoverButton class=" rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-brand-600">
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
		</PopoverButton>

		<PopoverPanel
			class="absolute right-0 z-10 mt-2 min-w-max origin-top-right rounded-md bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none "
		>
			<div class="block px-4 py-2 text-sm text-brand-900">
				<RadioGroup
					class="space-y-3 pt-1"
					value={sortOrder}
					on:change={(e) => (sortOrder = e.detail)}
				>
					<RadioGroupLabel class="px-5 text-base font-bold">Sort Order</RadioGroupLabel>
					<RadioGroupOption value="default" let:checked let:active>
						<span
							class:active
							class:checked
							class="relative block cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:outline-none sm:flex sm:justify-between"
						>
							<span class="flex items-center">
								<span class="flex flex-col text-sm">
									<span id="default" class="font-medium text-brand-900"
										>Percentage of Followers You Follow</span
									>
									<span id="default-description" class="text-brand-800">
										<span class="block font-light sm:inline">Prefers smaller accounts</span>
									</span>
								</span>
							</span>
							<span
								class={`pointer-events-none absolute -inset-px rounded-md border-2 ${
									active ? 'border' : 'border-2'
								} ${checked ? 'border-brand-600' : 'border-transparent'}`}
								aria-hidden="true"
							/>
						</span>
					</RadioGroupOption>
					<RadioGroupOption value="by-count" let:checked let:active>
						<span
							class:active
							class:checked
							class="relative block cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:outline-none sm:flex sm:justify-between"
						>
							<span class="flex items-center">
								<span class="flex flex-col text-sm">
									<span id="by-count" class="font-medium text-brand-900"
										>Most Followers You Follow</span
									>
									<span id="by-count-description" class="text-brand-800">
										<span class="block font-light sm:inline">Prefers larger accounts</span>
									</span>
								</span>
							</span>
							<span
								class={`pointer-events-none absolute -inset-px rounded-md ${
									active ? 'border' : 'border-2'
								} ${checked ? 'border-brand-600' : 'border-transparent'}`}
								aria-hidden="true"
							/>
						</span>
					</RadioGroupOption>
				</RadioGroup>
			</div>
		</PopoverPanel>
	</Popover>
</div>

<style>
	.checked {
		@apply border-transparent;
	}
	.active {
		@apply border-brand-600 ring-2 ring-brand-600;
	}
</style>
