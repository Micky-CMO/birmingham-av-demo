import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        // Small-phone breakpoints so the header can adapt on narrow devices.
        // `xs` ~ small phones (Galaxy S8 era and up). `xsm` ~ 380px, a common
        // mid-phone hinge. Tailwind's built-in `sm` remains 640px.
        xs: '380px',
        xsm: '420px',
      },
      colors: {
        brand: {
          green: '#1EB53A',
          'green-600': '#16A432',
          'green-400': '#4CD265',
          'green-100': '#E5F7EA',
          black: '#0A0A0A',
        },
        // Design-system paper + ink tokens (briefing §2)
        paper: {
          DEFAULT: '#F7F5F2',
          2: '#EDE9E3',
        },
        ink: {
          DEFAULT: '#17140F',
          900: '#0A0A0A',
          700: '#2B2E35',
          500: '#6B7280',
          300: '#D4D4D8',
          100: '#F3F4F6',
          60: 'rgba(23, 20, 15, 0.6)',
          30: 'rgba(23, 20, 15, 0.3)',
          10: 'rgba(23, 20, 15, 0.1)',
          50: '#F9FAFB',
        },
        obsidian: {
          950: '#050505',
          900: '#0B0D12',
          800: '#11141B',
          700: '#181C25',
          600: '#222833',
          500: '#323A48',
        },
        semantic: {
          positive: '#1EB53A',
          warning: '#F0B849',
          critical: '#FF4D5E',
          info: '#4F91FF',
        },
        tier: {
          probation: '#64748B',
          standard: '#4F91FF',
          preferred: '#1EB53A',
          elite: '#F0B849',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-instrument-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.04', letterSpacing: '-0.03em', fontWeight: '600' }],
        h1: ['40px', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        h2: ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.55' }],
        small: ['13px', { lineHeight: '1.5' }],
        caption: ['11px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
        'data-lg': ['32px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      borderRadius: { xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px' },
      boxShadow: {
        'glass-light': '0 8px 32px rgba(10, 10, 10, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass-dark': '0 24px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        lift: '0 8px 28px rgba(10, 10, 10, 0.08)',
        'ring-green': '0 0 0 1px rgba(30, 181, 58, 0.35), 0 0 24px rgba(30, 181, 58, 0.18)',
      },
      backdropBlur: { glass: '20px', heavy: '32px' },
      transitionTimingFunction: { unfold: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { 240: '240ms', 420: '420ms', 1200: '1200ms' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-green': {
          '0%': { boxShadow: '0 0 0 0 rgba(30, 181, 58, 0.5)' },
          '100%': { boxShadow: '0 0 0 12px rgba(30, 181, 58, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-green': 'pulse-green 1.8s ease-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
