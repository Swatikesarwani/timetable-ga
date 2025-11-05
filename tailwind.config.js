/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ✅ enables dark mode using a CSS class
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke",
      },
    },
  },
  plugins: [],
};
