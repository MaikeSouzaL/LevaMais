/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#02de95",
        "background-light": "#f5f8f7",
        "background-dark": "#0f231c",
        "surface-dark": "#16201d",
        "card-dark": "#1b2823",
        brand: {
          light: "#02de95", // Verde Leva+
          mid: "#00C483",
          dark: "#0f231c", // Fundo escuro
        },
        secondary: {
          blue: "#60A5FA", // Azul para segurança
        },
        surface: {
          primary: "#16201d", // Surface escuro
          secondary: "#1b2823", // Card escuro
        },
        gray: {
          100: "#E1E1E6",
          200: "#C4C4CC",
          300: "#8D8D99",
          400: "#7C7C8A",
          500: "#505059",
          600: "#4b5563",
          700: "#29292E",
          800: "#202024",
        },
        background: "#0f231c", // Fundo geral
      },
      fontFamily: {
        regular: "Roboto_400Regular",
        bold: "Roboto_700Bold",
      },
      boxShadow: {
        glow: "0 0 15px rgba(2, 222, 149, 0.4)",
      },
    },
  },
  plugins: [],
};
