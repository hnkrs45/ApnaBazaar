/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      screens: {
        '900px': '900px',
      },
      colors: {
        'organic-green': {
          DEFAULT: '#2d6a4f',
          light: '#52b788',
          dark: '#1b4332',
        },
        'earthy-brown': '#6c584c',
      }
    }
  },
  plugins: [],
}