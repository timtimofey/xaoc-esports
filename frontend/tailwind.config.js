/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080d19',
          card: '#0e1628',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#f59e0b',
          neon: '#06b6d4',
          emerald: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'soft-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 12s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'glitch': 'glitch 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
