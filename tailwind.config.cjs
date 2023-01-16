const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				goudy: ['GoudyBookletter', 'serif'],
			},
			colors: {
				// https://www.tints.dev/?accent=2F3BFA&brand=C97414&slate=FCF1E3
				brand: {
					50: '#FCF1E3',
					100: '#FAE4CC',
					200: '#F4C894',
					300: '#EFAD61',
					400: '#EA932E',
					500: '#C97414',
					600: '#A25E10',
					700: '#79460C',
					800: '#4F2E08',
					900: '#2A1804',
				},
				accent: {
					50: '#EBECFF',
					100: '#D7DAFE',
					200: '#AAB0FD',
					300: '#828BFC',
					400: '#5B65FB',
					500: '#2F3BFA',
					600: '#0615EA',
					700: '#0410AE',
					800: '#030A73',
					900: '#01053C',
				},
				slate: {
					50: '#FFFDFA',
					100: '#FFFDFA',
					200: '#FEFAF6',
					300: '#FDF6ED',
					400: '#FDF4E8',
					500: '#FCF1E3',
					600: '#F3C68C',
					700: '#E99B34',
					800: '#AF6B13',
					900: '#583609',
				},
			},
		},
	},

	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

module.exports = config;
