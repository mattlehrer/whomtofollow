import { writable } from 'svelte/store';
import type { Account } from './Account';

export const accountData = writable(new Map<string, Account>());

export const hosts = writable(new Map<string, string>());

export const updateAccountData = writable(false);

export const errors = writable<Record<string, string[]>>({});
