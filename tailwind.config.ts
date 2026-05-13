import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg: 'var(--cosmos-bg)',
          elevated: 'var(--cosmos-bg-elevated)',
          subtle: 'var(--cosmos-bg-subtle)',
          border: 'var(--cosmos-border)',
          'border-dim': 'var(--cosmos-border-dim)',
          text: 'var(--cosmos-text)',
          muted: 'var(--cosmos-text-muted)',
          dim: 'var(--cosmos-text-dim)',
          accent: 'var(--cosmos-accent)',
          'accent-dim': 'var(--cosmos-accent-dim)',
          code: 'var(--cosmos-code)',
          critical: 'var(--cosmos-critical)',
          high: 'var(--cosmos-high)',
          medium: 'var(--cosmos-medium)',
          low: 'var(--cosmos-low)',
          info: 'var(--cosmos-info)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Courier New', 'monospace'],
      },
      maxWidth: {
        cosmos: '1280px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
