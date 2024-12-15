export const Timeout = (time: number) => {
	const controller = new AbortController();
	setTimeout(() => controller.abort('Timeout'), time);
	return controller;
};
