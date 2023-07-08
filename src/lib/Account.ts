export const AccountRegex = /^@?[\w\-]+@[\w\-]+(\.[\w\-]+)+$/;

// https://docs.joinmastodon.org/entities/Account/
export type Account = {
	id: string;
	username: string;
	acct: string; // The Webfinger account URI. Equal to username for local users, or username@domain for remote users.
	url: string;
	display_name: string;
	note: string;
	avatar: string;
	avatar_static: string;
	header: string;
	header_static: string;
	locked: boolean;
	fields: Field[];
	emojis: CustomEmoji[];
	bot: boolean;
	group: boolean;
	discoverable: boolean | null;
	noindex?: boolean | null;
	moved?: Account | null;
	suspended?: boolean;
	limited?: boolean;
	created_at: string;
	last_status_at: string | null;
	statuses_count: number;
	followers_count: number;
	following_count: number;
	followed_by: Set<string>; // set of mutual followers
	// following?: Array<string>; // list of accts
};

export type Field = {
	name: string;
	value: string;
	verified_at: string | null;
};

export type CustomEmoji = {
	shortcode: string;
	url: string;
};
