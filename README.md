# Whom to Follow

## Find people to follow on the Fediverse

Whom to Follow is a tool to help you find people to follow on the Fediverse, including Mastodon, Pleroma, and Friendica. If your host does not seem to work, please open an issue.

The service works by retrieving a list of the accounts you follow and then retrieving the lists of all the accounts those follow, i.e., one step away from your network. Those accounts are then sorted by the ones I think you are most likely to be interested in. By default, the accounts are sorted by the percentage of your network that follows them, but you can also sort by the number of people that follow them.

As many requests as possible are sent directly from your browser to the different servers on the Fediverse. However, some requests are sent through a CORS proxy because they only allow server-to-server requests.

The app is built with SvelteKit and [whomtofollow.com](https://whomtofollow.com) is hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

### TODOs

- [x] handle custom emojis
- [x] toggle sort order: highest percentage vs most followed
- [ ] handle servers that require auth token to retrieve following list (e.g., mastodon.cloud, wien.rocks)
- [ ] CORS proxy toggle
- [ ] add FAQ
