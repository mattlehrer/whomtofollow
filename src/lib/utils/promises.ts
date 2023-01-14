export async function fulfilledValues<T>(promises: Promise<T>[]): Promise<T[]> {
	return Promise.allSettled(promises)
		.then((results) => {
			return results
				.filter((result) => result.status === 'fulfilled')
				.map((result) => (result as PromiseFulfilledResult<T>).value);
		})
		.catch((error) => {
			console.log({ error });
			return [];
		});
}
