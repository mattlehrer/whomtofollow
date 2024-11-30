import type { Account } from './Account';
import { getAccountInfo } from './getAccountInfo';
import { saveAcctInfo } from './saveAccountInfo';
import { fulfilledValues } from './utils/promises';
import { errors } from './data';
import { get } from 'svelte/store';
import { getDomain } from './getDomain';
import { Timeout } from './utils/timeout';

const DEFAULT_MAX_FOLLOWERS_TO_FETCH = 500;

export async function getFollows(
	ofAcct: Account['acct'],
	forSearcher: Account['acct'],
	direct = true,
	maxFollowersToFetch: number = DEFAULT_MAX_FOLLOWERS_TO_FETCH,
): Promise<Account[]> {
	function getNextPage(linkHeader: string | undefined): string | undefined {
		if (!linkHeader) return;

		// https://docs.joinmastodon.org/api/guidelines/#pagination
		const match = linkHeader.match(/<(.+)>; rel="next"/);
		return match?.[1];
	}

	if (!direct && ofAcct.toLowerCase() === forSearcher.toLowerCase()) {
		return [];
	}
	let accountInfo;
	try {
		accountInfo = await getAccountInfo(ofAcct);
	} catch (error: any) {
		if (error?.status) {
			if (get(errors)[error.status]) {
				errors.update((e) => ({ ...e, [error.status]: [...e[error.status], ofAcct] }));
			} else {
				errors.update((e) => ({ ...e, [error.status]: [ofAcct] }));
			}
		}
		return [];
	}
	if (!accountInfo.id) {
		return [];
	}
	const domain = await getDomain(ofAcct);

	let page: string | undefined =
		`https://${domain}/api/v1/accounts/${accountInfo.id}/following?limit=80`;

	let follows: Account[] = [];
	while (page && follows.length < maxFollowersToFetch) {
		// console.log('paging', { page, followsLength: follows.length, maxFollowersToFetch });
		let response;
		try {
			response = await fetch(page, {
				signal: Timeout(5000).signal,
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
			if (get(errors)[status]) {
				errors.update((e) => ({ ...e, [status]: [...e[status], ofAcct] }));
			} else {
				errors.update((e) => ({ ...e, [status]: [ofAcct] }));
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
		// trackProgress(saveAcctInfo({ accountToSave: f, direct, followedBy: ofAcct })),
		saveAcctInfo({ accountToSave: f, direct, followedBy: ofAcct }),
	);
	await fulfilledValues(followsPromises);

	return follows;
}
