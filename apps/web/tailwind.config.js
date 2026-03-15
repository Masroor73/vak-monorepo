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
          primary: "#D32F2F", 
          secondary: "#FBC02D", 
          background: "#F5F5F5",
          text: "#212121",
        },
        auth: {
          bg:            "#0C0E12",
          panel:         "#13161C",
          card:          "#1A1E27",
          input:         "#030712",
          border:        "#252A36",
          borderMid:     "#404040",
          borderFocus:   "#3B6FFF",
          blue:          "#3B6FFF",
          blueHover:     "#5a85ff",
          blueMuted:     "#1A3A7A",
          blueShadow:    "#1a2a5e",
          white:         "#FFFFFF",
          textPrimary:   "#F9FAFB",
          textSecondary: "#9CA3AF",
          textMuted:     "#6B7280",
          textFaint:     "#4B5563",
          green:         "#4ADE80",
          divider:       "#1F2937",
          pending:       "#F59E0B",
        },
      },
    },
  },
  plugins: [],
}
