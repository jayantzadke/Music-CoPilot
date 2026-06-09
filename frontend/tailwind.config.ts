import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#121212',
        elevated: '#1a1a1a',
        'elevated-2': '#242424',
        accent: '#1ed760',
        'accent-hover': '#1fdf64',
        muted: '#a7a7a7',
        subtle: '#6a6a6a',
        // keep css var aliases for components that already use them
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'surface-hover': 'var(--surface-hover)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
      },
      height: {
        player: '90px',
      },
      width: {
        sidebar: '240px',
        'sidebar-sm': '72px',
      },
    },
  },
  plugins: [],
}

export default config
