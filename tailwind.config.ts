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
        // 深炭 + 暖琥珀点缀（科技但不冰冷）
        ink: {
          50: "#f7f4ef",
          100: "#ebe4d8",
          200: "#d4c8b4",
          300: "#b3a48c",
          400: "#8f816c",
          500: "#746857",
          600: "#5c5246",
          700: "#463f37",
          800: "#312c27",
          900: "#1f1c19",
          950: "#12100e",
        },
        ember: {
          DEFAULT: "#e8a06a",
          soft: "#f0c29a",
          deep: "#c8783f",
          glow: "#ffb37a",
        },
        teal: {
          DEFAULT: "#3d9b8f",
          soft: "#7ec4bb",
          deep: "#2a6f67",
        },
        night: {
          DEFAULT: "#0e1114",
          card: "#161b20",
          mist: "#1e262d",
          lift: "#242d36",
        },
        // 兼容旧类名 → 映射到新色板
        sakura: {
          DEFAULT: "#e8a06a",
          soft: "#f0c29a",
          deep: "#c8783f",
          glow: "#ffb37a",
        },
        aqua: {
          DEFAULT: "#3d9b8f",
          soft: "#7ec4bb",
          deep: "#2a6f67",
        },
        accent: {
          DEFAULT: "#e8a06a",
          light: "#f0c29a",
          dark: "#c8783f",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        cute: ["var(--font-cute)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sakura: "0 0 40px rgba(232, 160, 106, 0.22)",
        aqua: "0 0 40px rgba(61, 155, 143, 0.18)",
        soft: "0 24px 60px rgba(0, 0, 0, 0.35)",
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
