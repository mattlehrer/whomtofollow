import { Timeout } from '$lib/utils/timeout';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { domain, acct } = params;
	try {
		const webfingerResp = await fetch(
			`https://${domain}/.well-known/webfinger?resource=acct:${acct}`,
			{
				signal: Timeout(3000).signal,
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
			return new Response(`No activity pub link for ${acct}`, { status: 404 });
		}
		return new Response(acctLink.href);
	} catch (e) {
		return new Response(`Failed to fetch webfinger data for ${acct}`, { status: 404 });
	}
};
