module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ['light', 'dark','cupcake'], // Ensuring light and dark are available
    darkTheme: 'cupcake',
    base: true,
    logs: true,  // Default dark theme
  },
}
