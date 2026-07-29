import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8f6fb",
          100: "#efeaf6",
          200: "#ddd3ea",
          300: "#c0b0d4",
          400: "#9a84b5",
          500: "#7c6598",
          600: "#644f7c",
          700: "#524065",
          800: "#453754",
          900: "#3b3047",
          950: "#1a1424",
        },
        sakura: {
          DEFAULT: "#ff8fb8",
          soft: "#ffc2d6",
          deep: "#e85a8c",
          glow: "#ff6b9d",
        },
        aqua: {
          DEFAULT: "#5ec8e8",
          soft: "#a8e4f5",
          deep: "#2a9fc4",
        },
        night: {
          DEFAULT: "#0f0a1a",
          card: "#1a1228",
          mist: "#261a38",
        },
        accent: {
          DEFAULT: "#ff8fb8",
          light: "#ffc2d6",
          dark: "#e85a8c",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        cute: ["var(--font-cute)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sakura: "0 0 40px rgba(255, 143, 184, 0.25)",
        aqua: "0 0 40px rgba(94, 200, 232, 0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        drift: "drift 18s linear infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        drift: {
          "0%": { transform: "translateY(0) rotate(0deg)" },
          "100%": { transform: "translateY(110vh) rotate(360deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
