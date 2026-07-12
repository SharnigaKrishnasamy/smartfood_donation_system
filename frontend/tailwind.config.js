/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // AgroTrack-adjacent but distinct: a deeper, more "harvest" green
        // paired with a warm off-white rather than stark white, so cards
        // and glass panels don't look clinical.
        brand: {
          50: "#f2faf4",
          100: "#e0f3e5",
          200: "#c1e6ca",
          300: "#94d1a5",
          400: "#5fb478",
          500: "#3a9958",
          600: "#297d44",
          700: "#216338",
          800: "#1d4f2f",
          900: "#194128",
          950: "#0b2416",
        },
        canvas: "#fbfaf6",
        canvasDark: "#0e1611",
        ink: "#16241c",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.035) 1px, transparent 0)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(20, 60, 35, 0.12)",
        card: "0 2px 12px 0 rgba(20, 60, 35, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
