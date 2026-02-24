import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        sb: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          border: '#E8E8ED',
          orange: '#FF6A00',
          'orange-light': '#FF8533',
          text: '#1D1D1F',
          'text-secondary': '#86868B',
          'text-tertiary': '#6E6E73',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          surface: '#F5F5F7',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
