/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#00E096", // Verde Neon
          mid: "#00C483",
          dark: "#091A2F",  // Azul Fundo
        },
        secondary: {
          blue: "#38BDF8", // Azul Recomendado
        },
        surface: {
          primary: "#11253E", // Card Ativo
          secondary: "#1E2D3D", // Card Inativo
        },
        gray: {
          100: "#E1E1E6",
          200: "#C4C4CC",
          300: "#8D8D99",
          400: "#7C7C8A",
          500: "#505059",
          600: "#323238",
          700: "#29292E",
          800: "#202024",
        },
        background: "#091A2F", // Fundo geral
      },
      fontFamily: {
        regular: "Roboto_400Regular",
        bold: "Roboto_700Bold",
      }
    },
  },
  plugins: [],
}
