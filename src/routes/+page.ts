import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
	const account = url.searchParams.get('account');
	return { account: account ?? '' };
}) satisfies PageLoad;
