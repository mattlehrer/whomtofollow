<script lang="ts">
	import distracted from '$lib/assets/distracted.jpg';

	export let account: string;
	export let isLoading: boolean;

	const AccountRegex = /^@?[\w-]+@[\w-]+(\.[\w-]+)+$/;
</script>

<div class="relative ">
	<div class="relative py-4">
		<section class="p-4 pb-8 sm:p-8 md:p-16 lg:pt-24 max-w-[100rem] px-8">
			<div class="lg:flex lg:gap-8">
				<div class="lg:w-1/2 sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
					<h1 class="block font-goudy text-brand-600">Whom to Follow</h1>
					<p
						class="font-goudy mt-3 text-xl text-brand-800 sm:mt-5 sm:text-xl sm:mx-auto lg:mx-0 opacity-80 sm:max-w-md"
					>
						Find accounts you'll love by searching the network of accounts you already follow.
					</p>
					<div class="mt-8 sm:mx-auto sm:max-w-lg sm:text-center lg:mx-0 lg:text-left">
						<p class="text-base font-medium text-gray-900">
							Enter your fediverse account to get started:
						</p>
						<form on:submit class="mt-3 sm:flex">
							<label for="account" class="sr-only">Fediverse account</label>
							<input
								type="text"
								name="account"
								id="account"
								bind:value={account}
								pattern={AccountRegex.source}
								class="block w-full rounded-full border-brand-300 py-3 text-base placeholder-gray-500 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:flex-1 sm:-ml-4 px-4"
								placeholder="gargron@mastodon.social"
							/>
							<button
								type="submit"
								disabled={isLoading}
								class="mt-3 w-full rounded-full border border-transparent bg-brand-700 px-6 py-3 text-base font-medium text-brand-50 shadow-sm hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:inline-flex sm:w-auto sm:flex-shrink-0 sm:items-center  disabled:opacity-25"
								>Search</button
							>
						</form>
						<p class="mt-3 text-base text-gray-500 font-goudy">
							We don't store any account data. Read our
							<a href="/privacy" class="font-medium text-gray-900 underline">Privacy Policy</a>.
						</p>
					</div>
				</div>
				<div
					class="lg:w-1/2 relative mt-8 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center -mx-4"
				>
					<!-- <div class="relative w-full rounded-lg shadow-lg lg:max-w-lg block "> -->
					<img
						class="w-full rounded-lg shadow-lg lg:max-w-lg"
						src={distracted}
						alt="distracted boyfriend meme looking at accounts they follow while accounts you follow is upset"
					/>
					<!-- </div> -->
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	h1 {
		font-size: clamp(3rem, 6vw, 5rem);
	}
</style>
