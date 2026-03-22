/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b1326',
          container: '#171f33',
          'container-high': '#222a3d',
          'container-lowest': '#060e20',
        },
        primary: {
          DEFAULT: '#bcc3ff',
          container: '#1e2a78',
        },
        secondary: '#4ae176',
        tertiary: '#ffb595',
        on_surface_variant: '#c6c5d3',
        outline_variant: '#454651',
        error: '#ffb4ab',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'round-eight': '0.5rem',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'ambient': '0 48px 48px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
