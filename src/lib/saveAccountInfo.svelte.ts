import type { Account } from './Account';
import { accountData, updateAccountData } from './data.svelte';
import { getAccountInfo } from './getAccountInfo';
import { getDomain } from './getDomain';
import { SvelteSet } from 'svelte/reactivity';

export async function saveAcctInfo({
	accountToSave,
	direct,
	followedBy,
}: {
	accountToSave: Account;
	direct: boolean;
	followedBy: Account['acct'];
}) {
	if (accountData.has(accountToSave.acct)) {
		const account = accountData.get(accountToSave.acct);
		if (!account) {
			throw new Error('account should exist');
		}
		accountData.set(accountToSave.acct, {
			...account,
			acct: accountToSave.acct,
			followers_count: Math.max(account.followers_count, accountToSave.followers_count),
			followed_by: account.followed_by.add(followedBy),
		});
		updateAccountData.update((b) => !b);
	} else {
		if (!direct) {
			accountData.set(accountToSave.acct, {
				...accountToSave,
				followed_by: new SvelteSet([followedBy]),
			});
			updateAccountData.update((b) => !b);
		} else {
			// different servers use different account IDs
			// if the account is a direct follow, we are going to need to do a follower lookup
			// on that acct's server. if the acct is on the same server, we're done.

			const fDomain = accountToSave.url.match(/https?:\/\/([^/]+)/)?.[1];
			const domain = await getDomain(followedBy);
			if (domain === fDomain) {
				accountData.set(accountToSave.acct, {
					...accountToSave,
					followed_by: new SvelteSet([followedBy]),
				});
				updateAccountData.update((b) => !b);
			} else {
				try {
					const fInfo = await getAccountInfo(accountToSave.acct);
					accountData.set(accountToSave.acct, {
						...fInfo,
						followed_by: new SvelteSet([followedBy]),
					});
					updateAccountData.update((b) => !b);
				} catch (error: unknown) {
					console.debug('saveAccountInfo', error);
					console.debug('Problem getting account info for', accountToSave.acct);
				}
			}
		}
	}
}
