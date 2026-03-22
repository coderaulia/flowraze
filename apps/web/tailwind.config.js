/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          container: '#4338CA',
        },
        secondary: '#22C55E',
        tertiary: '#7E3000',
        error: '#BA1A1A',
        'on-primary': '#FFFFFF',
        'on-surface': '#191C1E',
        'on-surface-variant': '#464555',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F2F4F6',
        'surface-container': '#ECEEF0',
        'surface-container-high': '#E6E8EA',
        'surface-container-highest': '#E0E3E5',
        'outline-variant': '#C7C4D8',
        'secondary-container': '#E2E1FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'editorial': '0 12px 32px -4px rgba(79, 70, 229, 0.08)',
      },
      backgroundImage: {
        'cta-gradient': 'linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)',
      },
    },
  },
  plugins: [],
};
