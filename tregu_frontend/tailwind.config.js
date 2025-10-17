/* eslint-disable */
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-contrast)',
          hover: 'var(--color-primary-hover)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)'
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)'
      },
      boxShadow: {
        sm: 'var(--shadow-1)',
        DEFAULT: 'var(--shadow-2)'
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)'
      }
    }
  },
  plugins: [],
  safelist: [
    { pattern: /(bg|text|border)-(primary|accent|success|warning|danger)/ },
    { pattern: /(bg|border|text)-(slate|indigo|emerald|amber|rose|sky|violet|cyan|green|teal|orange|pink|red|blue|lime)-(50|100|200|700|800)/ },
    { pattern: /(fill|stroke)-(slate|emerald|amber|rose|sky|violet|cyan|green|blue|indigo)-(200|400|500|600)/ }
  ]
}
module.exports = config
