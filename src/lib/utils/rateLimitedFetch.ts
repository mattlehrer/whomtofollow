import { Timeout } from './timeout';

const unimplementedDomains = ['threads.net'];

class RateLimitManager {
	rateLimitedDomains: Set<string>;
	cooldownPeriod: number;
	domainRateLimitTimes: Map<string, number>;

	constructor() {
		this.rateLimitedDomains = new Set();

		this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes

		this.domainRateLimitTimes = new Map();
	}

	isRateLimited(url: string) {
		const domain = new URL(url).hostname;

		// Check if domain is rate-limited
		if (this.rateLimitedDomains.has(domain)) {
			const lastLimitTime = this.domainRateLimitTimes.get(domain) || 0;

			// Check if cooldown period has passed
			if (Date.now() - lastLimitTime < this.cooldownPeriod) {
				return true;
			}

			// Remove from rate-limited domains if cooldown has passed
			this.rateLimitedDomains.delete(domain);
		}

		return false;
	}

	markRateLimited(url: string) {
		const domain = new URL(url).hostname;
		this.rateLimitedDomains.add(domain);
		this.domainRateLimitTimes.set(domain, Date.now());
	}

	async fetch(url: string, options = {}) {
		// Check if domain is currently rate-limited
		if (this.isRateLimited(url)) {
			throw new Error(`Domain ${new URL(url).hostname} is currently rate-limited`);
		}

		if (unimplementedDomains.includes(new URL(url).hostname)) {
			throw new Error(`Service at ${new URL(url).hostname} is not implemented`);
		}

		try {
			const response = await fetch(url, {
				signal: Timeout(5000).signal,
				...options,
			});

			// Check for 429 status
			if (response.status === 429) {
				this.markRateLimited(url);
				throw new Error('Rate limit exceeded');
			}

			return response;
		} catch (error: unknown) {
			// If the error is a rate limit error, mark the domain
			if (error instanceof Error && error.message.includes('429')) {
				this.markRateLimited(url);
			}
			throw error;
		}
	}
}

// Create a singleton instance
export const rateLimitedFetch = new RateLimitManager();
