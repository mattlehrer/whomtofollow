import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const [nickname, domain] = params.acct.split('@');
	const accountInfoRes = await fetch(
		`https://${domain}/api/v1/accounts/lookup?acct=${params.acct}`,
	);
	try {
		let accountInfo = await accountInfoRes.json();
		if (accountInfo.error === "Can't find user") {
			// Pleroma response (Mastodon responds with "Record not found")
			const pleromaInfoRes = await fetch(`https://${domain}/api/v1/accounts/${nickname}`);
			accountInfo = await pleromaInfoRes.json();
		}

		return new Response(JSON.stringify(accountInfo));
	} catch (error) {
		if (accountInfoRes.status === 404) {
			return new Response('Not found', { status: 404 });
		} else {
			return new Response('Internal server error', { status: 500 });
		}
	}
};
