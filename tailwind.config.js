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
        "background-dark": "#091A2F",
        "surface-dark": "#11253E",
        "card-dark": "#1E2D3D",
        brand: {
          light: "#02de95", // Verde Leva+
          mid: "#00C483",
          dark: "#091A2F", // Fundo escuro
        },
        secondary: {
          blue: "#60A5FA", // Azul para segurança
        },
        surface: {
          primary: "#11253E", // Surface escuro
          secondary: "#1E2D3D", // Card escuro
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
        background: "#091A2F", // Fundo geral
      },
      fontFamily: {
        regular: "Inter_400Regular",
        medium: "Inter_500Medium",
        semibold: "Inter_600SemiBold",
        bold: "Inter_700Bold",
        black: "Inter_900Black",
      },
      boxShadow: {
        glow: "0 0 15px rgba(2, 222, 149, 0.4)",
      },
    },
  },
  plugins: [],
};
