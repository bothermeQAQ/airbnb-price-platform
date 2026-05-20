import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#0d0d0e',
          850: '#111113',
          800: '#161619',
          750: '#1b1b1f',
          700: '#222227',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(0, -22px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease forwards',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
