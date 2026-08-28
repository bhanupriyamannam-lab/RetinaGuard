/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd4fe',
          300: '#8ebaff',
          400: '#5895fd',
          500: '#3272f7',
          600: '#1b52eb',
          700: '#153ec7',
          800: '#1635a1',
          900: '#17307f',
          950: '#101d4e',
        },
        navy: {
          800: '#151e2e',
          900: '#0f172a',
          950: '#090d16',
        },
        clinical: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
        },
        risk: {
          low: '#10b981',
          lowBg: '#ecfdf5',
          lowBorder: '#a7f3d0',
          moderate: '#f59e0b',
          moderateBg: '#fffbeb',
          moderateBorder: '#fde68a',
          high: '#ef4444',
          highBg: '#fef2f2',
          highBorder: '#fecaca',
          critical: '#b91c1c',
          criticalBg: '#fdf2f8',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'clinical': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'elevated': '0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
        'glow-brand': '0 0 25px -5px rgba(27, 82, 235, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
