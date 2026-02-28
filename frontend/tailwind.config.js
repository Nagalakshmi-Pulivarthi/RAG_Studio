/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcfb',
          100: '#f9f7f4',
          200: '#f3efe8',
        },
        sage: {
          500: '#5a9a7a',
          600: '#4a8568',
        },
        sky: {
          soft: '#0ea5e9',
          softHover: '#0284c7',
        },
      },
    },
  },
  plugins: [],
}

