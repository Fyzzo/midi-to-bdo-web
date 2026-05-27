/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bdo: {
          darkest: '#121214',
          dark: '#1d1d1f',
          light: '#242427',
          surface: '#313239',
          surfaceAlt: '#343436',
          border: '#444348',
          borderLight: '#595a62',
          gold: '#d8ad70',
          goldLight: '#ddc39e',
          goldBright: '#ffedd4',
          goldDark: '#b09046',
          goldScroll: '#cca471',
          text: '#e0e0e0',
          textDim: '#9a9a9e',
          textGold: '#d4bc98',
          error: '#e05555',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 5px rgba(216, 173, 112, 0.2), 0 0 10px rgba(216, 173, 112, 0.1)' },
          '100%': { 'box-shadow': '0 0 15px rgba(216, 173, 112, 0.5), 0 0 25px rgba(216, 173, 112, 0.3)' },
        }
      }
    },
  },
  plugins: [],
}
