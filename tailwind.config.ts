import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // <alpha-value> lets bg-surface/60 and text-muted/70 keep working while the
      // underlying colour is swapped by the light/dark theme.
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        done: "rgb(var(--done) / <alpha-value>)",
        "header-top": "rgb(var(--header-top) / <alpha-value>)",
        "card-done": "rgb(var(--card-done) / <alpha-value>)",
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
