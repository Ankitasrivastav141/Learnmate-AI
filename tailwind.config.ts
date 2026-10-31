/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // User custom palette:
        // Burgundy: #652D3D
        // Cream: #F3EDE3
        // Black: #252222
        // Dusty Rose: #B58B83
        burgundy: {
          DEFAULT: '#652D3D',
          hover: '#522431',
          light: '#7e384c',
          dark: '#3e1b25',
          50: '#fbf7f8',
          100: '#f5eaed',
          200: '#edd8dd',
          500: '#652D3D',
          600: '#522431',
          700: '#3e1b25',
        },
        cream: {
          DEFAULT: '#F3EDE3',
          light: '#faf7f2',
          muted: '#ded4c5',
          dark: '#c4b5a0',
        },
        charcoal: {
          DEFAULT: '#252222',
          dark: '#1a1818',
          card: '#2c2727',
          surface: '#332e2e',
          border: '#443d3d',
        },
        dustyrose: {
          DEFAULT: '#B58B83',
          light: '#cbb0aa',
          dark: '#936a62',
          muted: 'rgba(181, 139, 131, 0.15)',
        },
        primary: {
          DEFAULT: '#652D3D',
          hover: '#522431',
          50: '#fbf7f8',
          100: '#f5eaed',
          500: '#652D3D',
          600: '#522431',
          700: '#3e1b25',
        },
        sidebar: {
          DEFAULT: '#1c1919',
          foreground: '#F3EDE3',
          border: '#383232',
        }
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
