/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        casino: {
          bg:       '#080b14',
          surface:  '#0f1526',
          card:     '#141828',
          border:   '#1e2540',
          gold:     '#f0b72f',
          'gold-d': '#a87820',
          felt:     '#0a1f12',
          win:      '#22c55e',
          lose:     '#ef4444',
          muted:    '#6b7a99',
        }
      },
      animation: {
        'coin-spin': 'coinSpin 1.6s cubic-bezier(0.2,0.8,0.4,1) forwards',
        'dice-roll': 'diceRoll 0.8s ease-out forwards',
        'fade-in':   'fadeIn 0.3s ease',
        'slide-up':  'slideUp 0.3s ease',
        'pulse-gold':'pulseGold 1s ease infinite',
        'shake':     'shake 0.5s ease',
      },
      keyframes: {
        coinSpin: {
          '0%':   { transform: 'rotateY(0deg) scale(1)' },
          '40%':  { transform: 'rotateY(720deg) scale(1.15)' },
          '100%': { transform: 'rotateY(1800deg) scale(1)' },
        },
        diceRoll: {
          '0%':   { transform: 'rotate(-20deg) scale(0.8)', opacity: '0' },
          '60%':  { transform: 'rotate(10deg) scale(1.1)' },
          '100%': { transform: 'rotate(0deg) scale(1)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseGold: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(240,183,47,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(240,183,47,0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-8px)' },
          '60%':     { transform: 'translateX(8px)' },
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
