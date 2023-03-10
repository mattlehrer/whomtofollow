import { get } from 'svelte/store';
import { accountData, hosts } from './data';
import { Timeout } from './utils/timeout';

export async function getDomain(acct: string): Promise<string> {
	const server = acct.split('@')[1];
	if (get(hosts).has(server)) {
		// assume that all other users with the same domain are on the same server
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return get(hosts).get(server)!;
	}

	if (get(accountData).has(acct)) {
		const account = get(accountData).get(acct);
		if (account?.url) {
			const match = account.url.match(/^https?:\/\/([\w-]+(\.[\w-]+)+)/);
			if (match?.length === 3) {
				return match[1];
			}
		}
	}

	// check webfinger
	const match = acct.match(/^@?(.+)@(.+)$/);
	if (match?.length !== 3) {
		throw new Error(`Incorrect handle: ${acct}`);
	}
	const domain = match[2];

	try {
		const webfingerResp = await fetch(
			`https://${domain}/.well-known/webfinger?resource=acct:${acct}`,
			{
				signal: Timeout(5000).signal,
			},
		);
		const webfinger = await webfingerResp.json();
		const links = webfinger.links;
		type AcctLink = {
			rel: string;
			type: string;
			href: string;
		};
		const acctLink: AcctLink = links.find(
			(l: AcctLink) => l.rel === 'self' && l.type === 'application/activity+json',
		);
		if (!acctLink) {
			throw new Error(`No activity pub link for ${acct}`);
		}
		const acctUrl = new URL(acctLink.href);
		get(hosts).set(server, acctUrl.host);
		return acctUrl.host;
	} catch (error) {
		// console.log('getDomain', error, acct);
	}
	try {
		const webfingerResp = await fetch(`/api/webfinger/${domain}/${acct}`, {
			signal: Timeout(5000).signal,
		});
		const acctLinkHref = await webfingerResp.text();
		const acctUrl = new URL(acctLinkHref);
		get(hosts).set(server, acctUrl.host);
		return acctUrl.host;
	} catch (error) {
		console.debug('getDomain webfinger', error, acct);
	}
	throw new Error(`Error getting domain for ${acct}`);
}
