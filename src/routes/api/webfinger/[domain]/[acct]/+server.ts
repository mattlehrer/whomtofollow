import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { domain, acct } = params;
	try {
		const webfingerResp = await fetch(
			`https://${domain}/.well-known/webfinger?resource=acct:${acct}`,
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
			throw error(404, `No activity pub link for ${acct}`);
		}
		return new Response(acctLink.href);
	} catch (e) {
		throw error(500, `Failed to fetch webfinger data for ${acct}`);
	}
};
