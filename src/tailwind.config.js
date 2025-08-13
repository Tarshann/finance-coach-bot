/** @type {import('tailwindcss').Config} */
mmodule.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      maxWidth: { 'measure': '78ch' },
      boxShadow: { 'soft': '0 6px 20px -6px rgba(0,0,0,0.12)' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};