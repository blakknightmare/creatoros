/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',   // violet-50
          100: '#ede9fe',  // violet-100
          200: '#ddd6fe',  // violet-200
          300: '#c4b5fd',  // violet-300
          400: '#a78bfa',  // violet-400
          500: '#8b5cf6',  // violet-500 (primary)
          600: '#7c3aed',  // violet-600 (primary hover)
          700: '#6d28d9',  // violet-700
          800: '#5b21b6',  // violet-800
          900: '#4c1d95',  // violet-900
          950: '#3b1471',  // violet-950
        },
        accent: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#ff6b6b',  // coral-500 (accent)
          600: '#fa5252',  // coral-600 (accent hover)
          700: '#f03e3e',
          800: '#e03131',
          900: '#c92a2a',
          950: '#a61e2e',
        },
      },
    },
  },
  plugins: [],
};
