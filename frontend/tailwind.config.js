/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app/**/*.{js,vue,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        critical: {
          DEFAULT: '#DC143C',
          light: '#FF6B8A',
          dark: '#A00F2C'
        },
        fatal: {
          DEFAULT: '#8B0000',
          light: '#B30000',
          dark: '#5C0000'
        },
        error: {
          DEFAULT: '#FF0000',
          light: '#FF4444',
          dark: '#CC0000'
        },
        warning: {
          DEFAULT: '#FFA500',
          light: '#FFB732',
          dark: '#CC8400'
        },
        info: {
          DEFAULT: '#00BFFF',
          light: '#33CCFF',
          dark: '#0099CC'
        },
        debug: {
          DEFAULT: '#808080',
          light: '#A0A0A0',
          dark: '#606060'
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-in',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
