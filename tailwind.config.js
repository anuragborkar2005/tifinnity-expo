/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'forest-green': '#0F6A33',
        'mint-sage': '#E2F2E4',
        'soft-pink': '#FDE8E9',
        'muted-charcoal': '#1A1A1A',
        'soft-gray': '#6B7280',
        'safety-orange': '#FF6B35',
        'cream-tan': '#EFECE6',
        'crimson-red': '#DC2626',
        'amber-star': '#F59E0B',
      },
      fontFamily: {},
    },
  },
};
