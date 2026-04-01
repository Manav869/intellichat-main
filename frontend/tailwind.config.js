/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
      },
    },
  },
  plugins: [],
}