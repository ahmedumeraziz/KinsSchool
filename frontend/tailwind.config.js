/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: { DEFAULT: '#1B4FD8', dark: '#0F2878', light: '#EFF6FF' },
        emerald: { DEFAULT: '#059669', dark: '#047857', light: '#ECFDF5' },
        sidebar: '#0D1F5C',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.4s ease-out',
      }
    }
  },
  plugins: []
}
