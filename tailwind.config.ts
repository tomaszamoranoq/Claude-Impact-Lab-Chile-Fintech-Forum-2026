import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f9efe4",
        vellum: "#fdf9f4",
        chalk: "#fdfdfd",
        ink: "#3f434a",
        graphite: "#2d2f34",
        slate: "#656565",
        ash: "#9da3af",
        "silver-mist": "#d9dde6",
        linen: "#f0e4d6",
        blueprint: "#2e77e5",
        sage: "#547358",
        buttercup: "#fbf4d8",
        ochre: "#7f6c1f",
        blossom: "#fae9f4",
        mauve: "#9d4d77",
        terracotta: "#f67748",
        "dusk-blue": "#446aa7",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.01), 0 2px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "18px",
      },
    },
  },
  plugins: [],
};

export default config;
