import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        morpho: {
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          ink: "#0D0D0D",
          muted: "#6B7280",
          line: "#E8EAEE",
          lineStrong: "#D5D8DE",
          blue: "#2470FF",
          blueHover: "#1B5FE0",
          blueSoft: "#EAF1FF",
          green: "#12A164",
          greenSoft: "#E8F8F0",
          red: "#E5484D",
          redSoft: "#FDECEC",
          amber: "#B45309",
          amberSoft: "#FFF7ED",
        },
      },
      fontFamily: {
        sans: ["var(--font-framecap-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-framecap-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
