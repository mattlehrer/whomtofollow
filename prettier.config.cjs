module.exports = {
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	useTabs: true,
	singleQuote: true,
	trailingComma: 'all',
	printWidth: 100,
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};
