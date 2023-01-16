import { describe, it, assert } from 'vitest';
import { fulfilledValues } from './promises';

describe('test whomtofollow', function () {
	it('test fulfilledValues', function () {
		const promises: Promise<string>[] = [
			new Promise<string>((resolve, reject) => {
				setTimeout(() => {
					resolve('success');
				}, 2000);
			}),
			new Promise<string>((resolve, reject) => {
				setTimeout(() => {
					reject('error');
				}, 2000);
			}),
		];
		fulfilledValues(promises).then((values: string[]) => {
			assert.isOk(values);
			assert.equal(values.length, 1);
			assert.equal(values[0], 'success');
		});
	});
});
