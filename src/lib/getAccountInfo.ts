import type { Account } from './Account';
import { accountData, updateAccountData } from './data.svelte';
import { getDomain } from './getDomain';
import { SvelteSet } from 'svelte/reactivity';
import { rateLimitedFetch } from './utils/rateLimitedFetch';

export async function getAccountInfo(acct: Account['acct'], force = false): Promise<Account> {
	if (!force && accountData.has(acct)) {
		return accountData.get(acct)!;
	}
	let accountInfo: Account & { error?: string; error_description?: string };
	try {
		const domain = await getDomain(acct);
		let accountInfoRes = await rateLimitedFetch.fetch(
			`https://${domain}/api/v1/accounts/lookup?acct=${acct}`,
		);
		if (!accountInfoRes.ok) {
			if (accountInfoRes.type === 'cors') {
				accountInfoRes = await rateLimitedFetch.fetch(`/api/acct/${acct}`);
			}
		}
		if (!accountInfoRes.ok) {
			throw new Error(accountInfoRes.statusText);
		}

		accountInfo = await accountInfoRes.json();
		// (Mastodon responds with "Record not found")
		if (accountInfo.error === "Can't find user") {
			// Pleroma error = "Can't find user"
			const nickname = acct.split('@')[0];
			const nonMastodonInfoRes = await rateLimitedFetch.fetch(
				`https://${domain}/api/v1/accounts/${nickname}`,
			);
			accountInfo = await nonMastodonInfoRes.json();
		} else if (accountInfo.error === "Couldn't find user") {
			// Rebased (Pleroma fork) error = "Couldn't find user"
			const nickname = acct.split('@')[0];
			const nonMastodonInfoRes = await rateLimitedFetch.fetch(
				`https://${domain}/api/v1/accounts/${nickname}`,
			);
			accountInfo = await nonMastodonInfoRes.json();
		} else if (
			accountInfo.error_description ===
			// Friendica error_description = "The API endpoint is currently not implemented but might be in the future.
			'The API endpoint is currently not implemented but might be in the future.'
		) {
			console.log('Friendica');
			const nickname = acct.split('@')[0];
			const nonMastodonInfoRes = await rateLimitedFetch.fetch(
				`https://${domain}/api/v1/accounts/${nickname}`,
			);
			accountInfo = await nonMastodonInfoRes.json();
		}

		while (accountInfo.moved) {
			accountInfo = await getAccountInfo(accountInfo.moved.acct);
		}
		accountData.set(acct, { ...accountInfo, followed_by: new SvelteSet() });
		updateAccountData.update((b) => !b);
	} catch (e: unknown) {
		console.debug({ e });
		throw new Error(`Error getting ${acct} info`);
	}
	return accountInfo;
}
