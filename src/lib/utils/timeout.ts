export const Timeout = (time: number) => {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), time);
	return controller;
};
