/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        damascus: {
          primary: "#D32F2F",
          secondary: "#FBC02D",
          background: "#F5F5F5",
          text: "#212121",
        },
        brand: {
          background: "#F5F5F5",
          primary: "#62CCEF",
          secondary: "#0d1b3e",
          secondaryLight: "#1a3278",
          success: "#05CC66",
        },
        auth: {
          primary: "#031245",
          accent: "#3A9AFF",   
          mid:    "#261CC1",   
          deep:   "#0B1A6E",  
          pending:"#F59E0B", 
        },
      },
    },
  },
  plugins: [],
};
// #09165E – slightly darker
// #08124F – deeper
// #061041 – rich navy depth
// #050D36 – very deep
// #040A2B – near midnight
// #02061A – almost black-blue 
// #04103D – subtle shift toward true blue
// #031245 – deeper navy blue
// #02154F – rich midnight blue
// #011A5C – strong deep blue presence
// #001F6E – very bold dark blue (cleanest blue shift)