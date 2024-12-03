import themes from "./src/themes/store.json";
module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: themes,// Ensuring light and dark are available
    darkTheme: 'cupcake',
    base: true,
    logs: true,  // Default dark theme
  },
}
