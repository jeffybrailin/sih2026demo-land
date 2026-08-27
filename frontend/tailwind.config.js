/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Public Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d2ff',
          300: '#8aabff',
          400: '#5480ff',
          500: '#2955ff',
          600: '#1E3A8A',
          700: '#172e70',
          800: '#112258',
          900: '#0F172A',
          950: '#080e1a',
        },
        slate: {
          750: '#334155',
          850: '#1e293b',
        },
        alert: {
          safe:     '#16A34A',
          watch:    '#D97706',
          high:     '#EA580C',
          critical: '#DC2626',
        },
      },
      fontSize: {
        'h1': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['19px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'sm-gov': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'xs-gov': ['11px', { lineHeight: '1.3', fontWeight: '400' }],
        'label': ['10px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        'gov': '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'alert': '0 0 0 3px rgba(220,38,38,0.4)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.35s ease-out',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        'xs': '400px',
      },
    },
  },
  plugins: [],
}
