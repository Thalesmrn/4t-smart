/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f8f3",
          100: "#dfeee1",
          200: "#b9dcbf",
          300: "#8cc397",
          400: "#5fa76d",
          500: "#3f8b4d",
          600: "#2f6f3c",
          700: "#275832",
          800: "#22462a",
          900: "#1c3b24",
        },
        coffee: {
          50: "#f6f1ec",
          100: "#e9ddd0",
          200: "#d3bda1",
          300: "#b8996f",
          400: "#a17c4f",
          500: "#87643d",
          600: "#6c4f32",
          700: "#553f29",
          800: "#3f2e1f",
          900: "#2a1f16",
        },
      },
    },
  },
  plugins: [],
};
