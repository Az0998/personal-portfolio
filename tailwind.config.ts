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
        rose: {
          DEFAULT: "#e44c65",
          soft: "#ff7a90",
          deep: "#c73a52",
        },
        // 兼容旧类名
        sakura: {
          DEFAULT: "#e44c65",
          soft: "#ff7a90",
          deep: "#c73a52",
          glow: "#ff9aab",
        },
        aqua: {
          DEFAULT: "#5ec8e8",
          soft: "#a8e4f5",
          deep: "#2a9fc4",
        },
        ember: {
          DEFAULT: "#e44c65",
          soft: "#ff7a90",
          deep: "#c73a52",
          glow: "#ff9aab",
        },
        teal: {
          DEFAULT: "#5ec8e8",
          soft: "#a8e4f5",
          deep: "#2a9fc4",
        },
        ink: {
          50: "#fff5f7",
          100: "#ffe4ea",
          200: "#ffc2d0",
          300: "#e8b0bc",
          400: "#c49aa6",
          500: "#9a7884",
          600: "#735860",
          700: "#4d3a40",
          800: "#2e2226",
          900: "#1a1218",
          950: "#120c10",
        },
        night: {
          DEFAULT: "#1a1218",
          card: "rgba(255,255,255,0.12)",
          mist: "rgba(255,255,255,0.08)",
          lift: "rgba(255,255,255,0.16)",
        },
        accent: {
          DEFAULT: "#e44c65",
          light: "#ff7a90",
          dark: "#c73a52",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        cute: ["var(--font-cute)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sakura: "0 8px 28px rgba(228, 76, 101, 0.4)",
        aqua: "0 8px 28px rgba(94, 200, 232, 0.25)",
        soft: "0 16px 40px rgba(0, 0, 0, 0.35)",
        avatar: "1rem 0.25rem 1.25rem rgba(245, 174, 115, 0.55)",
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
