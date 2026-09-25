import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#15130F",
        panel: "#1D1A15",
        "panel-2": "#18150F",
        line: "#302B22",
        "line-soft": "#221E17",
        amber: {
          DEFAULT: "#FFB000",
          dim: "#8C6318",
          glow: "rgba(255, 176, 0, 0.35)",
        },
        crimson: {
          DEFAULT: "#D64550",
          muted: "rgba(214, 69, 80, 0.15)",
        },
        verdigris: {
          DEFAULT: "#4FA98A",
          muted: "rgba(79, 169, 138, 0.15)",
        },
        ember: {
          DEFAULT: "#FF6B4A",
          glow: "rgba(255, 107, 74, 0.35)",
        },
        steel: {
          DEFAULT: "#5B9BD5",
          glow: "rgba(91, 155, 213, 0.35)",
        },
        violet: {
          DEFAULT: "#9D7FE8",
          glow: "rgba(157, 127, 232, 0.35)",
        },
        text: {
          DEFAULT: "#EDE6DA",
          dim: "#A79C8A",
          faint: "#6B6255",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
        serif: ["var(--font-serif)", "IBM Plex Serif", "serif"],
        sans: ["var(--font-sans)", "IBM Plex Sans", "sans-serif"],
        "panel-heading": ["'Bricolage Grotesque'", "Space Grotesk", "sans-serif"],
        "panel-body": ["'Hanken Grotesk'", "IBM Plex Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "3px",
      },
    },
  },
  plugins: [],
};

export default config;
