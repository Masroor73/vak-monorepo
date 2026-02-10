/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}" 
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        damascus: {
          VAKBlue: '#62CCEF',
          VAKDarkBlue: "#063386",
          VAKGreen: "#05CC66",
          primary: "#D32F2F", 
          secondary: "#FBC02D", 
          background: "#F5F5F5",
          text: "#212121",
        }
      },
    },
  },
  plugins: [],
}

