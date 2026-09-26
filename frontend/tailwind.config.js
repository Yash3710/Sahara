/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0fa',
          100: '#cce1f5',
          200: '#99c3ea',
          300: '#66a5e0',
          400: '#3387d5',
          500: '#0069cb',
          600: '#0054a2',
          700: '#014075',
          800: '#01325c',
          900: '#002544',
        },
        secondary: {
          50: '#fcf6e8',
          100: '#f9edd1',
          200: '#f4daa3',
          300: '#efc775',
          400: '#eab447',
          500: '#dea321',
          600: '#b2821a',
          700: '#856214',
          800: '#59410d',
          900: '#2c2107',
        },
        ink: {
          50: "#FAFAFA",
          100: "#F0EFEC",
          200: "#E2E0DB",
          300: "#C8C5BE",
          400: "#9E9A91",
          500: "#6E6A62",
          600: "#4A4741",
          700: "#363330",
          800: "#2C2C2C",
          900: "#1A1A1A",
        },
        cream: "#F7F6F3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        lift: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        glow: "0 0 0 4px rgba(1,64,117,0.15)",
        button: "0 2px 8px rgba(0,0,0,0.08)",
        nav: "0 1px 0 rgba(0,0,0,0.05)",
        soft: "0 8px 40px rgba(0,0,0,0.06)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        heartbeat: "heartbeat 3s ease-in-out infinite",
        "glow-ring": "glowRing 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.9" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "10%": { transform: "scale(1.15)" },
          "20%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.1)" },
          "40%": { transform: "scale(1)" },
        },
        glowRing: {
          "0%, 100%": { boxShadow: "0 0 0 0px rgba(1,64,117,0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(1,64,117,0.08)" },
        },
      },
    },
  },
  plugins: [],
};
