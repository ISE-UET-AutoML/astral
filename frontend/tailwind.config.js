/** @type {import('tailwindcss').Config} */
module.exports = {
	mode: 'jit',
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			padding: {
				'custom-105': '105px',
			},
			animation: {
				'spin-slow': 'spin 2s linear infinite',
			},
		},
	},
	plugins: [],
}
