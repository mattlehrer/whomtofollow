import { writable } from 'svelte/store';
import type { Account } from './Account';

export const accountData = writable(new Map<string, Account>());
