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
        // Modern Academic Learning Palette:
        navy: {
          DEFAULT: '#172554',
          hover: '#0f172a',
          light: '#1e3a8a',
          900: '#0f172a',
          800: '#172554',
          700: '#1e3a8a',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          light: '#3b82f6',
          dark: '#1e40af',
        },
        teal: {
          DEFAULT: '#0F766E',
          hover: '#115e59',
          light: '#14b8a6',
          dark: '#134e4a',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        sidebar: {
          DEFAULT: '#172554',
          foreground: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};
