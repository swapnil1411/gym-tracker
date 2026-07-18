import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1114",
        surface: "#181D22",
        raised: "#212830",
        line: "#2A323B",
        text: "#F3F2EC",
        muted: "#8B949E",
        accent: "#FF5A1F",
        done: "#39D98A",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "460px",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(.4)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        sheetUp: {
          from: { transform: "translate(-50%, 100%)" },
          to: { transform: "translate(-50%, 0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        pop: "pop .28s cubic-bezier(.2,.9,.2,1)",
        sheetUp: "sheetUp .28s cubic-bezier(.2,.9,.2,1)",
        fadeIn: "fadeIn .2s ease",
      },
    },
  },
  plugins: [],
};

export default config;
