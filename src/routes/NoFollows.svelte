<script lang="ts">
	import HideSocialGraph from '$lib/assets/hide-social-graph-setting.png';

	export let host = 'mastodon.social';

	// TODO: change the copy and image based on server type
</script>

<section class="px-4 pb-8 sm:px-8 md:px-16 max-w-[40rem]">
	<p>
		We tried and could not get the list of accounts you follow. Either you don't follow any accounts
		yet (check out <a href="https://fedipages.com/">FediPages</a> to find some) or you have the
		"Hide your social graph" setting checked in
		<a target="_blank" rel="noopener noreferrer" href={`https://${host}/settings/profile`}
			>your Mastodon profile settings</a
		>:
	</p>
	<img
		src={HideSocialGraph}
		alt="Screenshot of Mastodon settings, with an arrow to Hide Your Social Graph, which is unchecked"
		class="w-full rounded-lg max-w-[40rem] my-6"
	/>
	<p>
		Whom to Follow needs access to your social graph to work. If you are willing, please uncheck <a
			class="underline text-accent-600"
			target="_blank"
			rel="noopener noreferrer"
			href={`https://${host}/settings/profile`}>that setting</a
		> and come back and try again.
	</p>
	<p>
		If you don't have that setting checked, you aren't using Mastodon, or something else is wrong,
		please let me know on <a
			href={`https://${host}/share?text=I%20can't%20get%20whom%20to%20follow%20to%20work%20for%20my%20account.`}
			>Mastodon</a
		>
		or
		<a href="https://github.com/mattlehrer/whomtofollow/issues/new?title=No+Following+Found"
			>Github</a
		>. I'll try to help as soon as I can.
	</p>
</section>

<style>
	p {
		@apply mt-6;
	}

	a {
		@apply text-accent-700 underline;
	}
</style>
