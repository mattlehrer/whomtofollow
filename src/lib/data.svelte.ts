import { writable } from 'svelte/store';
import type { Account } from './Account';
import { SvelteMap } from 'svelte/reactivity';

export const accountData = new SvelteMap<string, Account>();

export const hosts = writable(new Map<string, string>());

export const updateAccountData = writable(false);

export const errors = writable<Record<string, string[]>>({});
