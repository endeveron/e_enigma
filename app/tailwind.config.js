/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './app/(screens)/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        // Paragraph
        pthin: ['NotoSans-Thin', 'sans-serif'], // 100
        pextralight: ['NotoSans-ExtraLight', 'sans-serif'], // 200
        plight: ['NotoSans-Light', 'sans-serif'], // 300
        pregular: ['NotoSans-Regular', 'sans-serif'], // 400
        pmedium: ['NotoSans-Medium', 'sans-serif'], // 500
        psemibold: ['NotoSans-SemiBold', 'sans-serif'], // 600
        pbold: ['NotoSans-Bold', 'sans-serif'], // 700
        pextrabold: ['NotoSans-ExtraBold', 'sans-serif'], // 800
        pblack: ['NotoSans-Black', 'sans-serif'], // 900
      },
      animation: {
        'fade-in': '0.2s ease-in-out fadeIn',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
