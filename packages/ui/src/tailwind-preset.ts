import type { Config } from 'tailwindcss';

export const tailwindPreset: Partial<Config> = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1EB53A',
          'green-600': '#16A432',
          'green-400': '#4CD265',
          'green-100': '#E5F7EA',
          black: '#0A0A0A',
        },
        ink: {
          900: '#0A0A0A',
          700: '#2B2E35',
          500: '#6B7280',
          300: '#D4D4D8',
          100: '#F3F4F6',
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
    },
  },
};
