import { writable } from 'svelte/store';
import type { Account } from '../lib/Account';

export const accountData = writable(new Map<string, Account>());
