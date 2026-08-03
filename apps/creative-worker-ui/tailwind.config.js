export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "../../shared/ui/*.{js,jsx}",
    "../../shared/ui/components/**/*.{js,jsx}",
    "../../shared/hooks/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d8edff",
          600: "#1877c9",
          700: "#135f9f",
          900: "#11324d",
        },
      },
    },
  },
  plugins: [],
};
