import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        "gradient-light": "linear-gradient(to bottom right, #eff6ff, #ffedd5)",
        "gradient-dark": "linear-gradient(to bottom right, #020617, #1e1b4b, #2e1065)",
      },
    },
  },
  plugins: [],
};
export default config;
