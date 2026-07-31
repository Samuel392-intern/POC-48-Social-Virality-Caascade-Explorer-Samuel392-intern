/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],

  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        rails: {
          obsidian: '#030712',
          surface: '#0B1117',
          surfaceRaised: '#0F1720',

          cyan: '#38BDF8',
          indigo: '#818CF8',

          border: '#1F2937',

          muted: '#64748B',
          text: '#E5E7EB',
          textMuted: '#94A3B8',
        },
      },

      boxShadow: {
        'rails-glow':
          '0 0 24px rgba(56, 189, 248, 0.08)',

        'rails-glow-strong':
          '0 0 30px rgba(56, 189, 248, 0.14)',
      },

      backgroundImage: {
        'rails-grid':
          'linear-gradient(rgba(31,41,55,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,55,0.18) 1px, transparent 1px)',
      },

      backgroundSize: {
        'rails-grid': '32px 32px',
      },
    },
  },

  plugins: [],
};

export default config;