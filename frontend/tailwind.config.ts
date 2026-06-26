import type { Config } from "tailwindcss";

/**
 * Design system « Luxe Sombre & Immersif »
 * Palette officielle du cahier des charges (§2.1).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0d0d0d",     // Fond dominant (Noir Obsidienne)
        anthracite: "#1a1a1a",   // Surfaces & cartes (Gris Anthracite)
        bronze: "#d4af37",       // Accent principal (Bronze brossé / Or)
        amber: "#ffaa00",        // Lueur interactive (Ambre chaud)
        ember: "#ff6a2b",        // Braise
        cream: "#efe6d6",
        smoke: "#a89c8b",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        lux: "cubic-bezier(.16,1,.3,1)",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(255,170,0,.4)",
      },
    },
  },
  plugins: [],
};
export default config;
