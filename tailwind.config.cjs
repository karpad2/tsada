module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom color palette to replace DaisyUI base colors
        gray: {
          750: '#2d3748', // Custom shade between 700 and 800
        }
      }
    },
  },
  plugins: [],
}
