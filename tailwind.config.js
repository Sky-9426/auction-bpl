/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B3E',
          light: '#1a2d5a',
          dark: '#060d1f',
        },
        bpl: {
          orange: '#F5A623',
          gold: '#FFD700',
          fire: '#FF6B00',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Titillium Web', 'sans-serif'],
        mono: ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease',
        'bid-flash': 'bidFlash 0.5s ease',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(245,166,35,0.3)' },
          '100%': { boxShadow: '0 0 60px rgba(245,166,35,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        bidFlash: {
          '0%': { backgroundColor: 'rgba(245,166,35,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      backgroundImage: {
        'field': "url('/field-texture.svg')",
      },
    },
  },
  plugins: [],
}
