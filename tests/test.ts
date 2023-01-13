import { expect, test } from '@playwright/test';

test('index page has expected input label', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('label')).toBe('Your Fediverse Account:');
});
