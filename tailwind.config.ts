import type { Config } from "tailwindcss";

// NOTE: In Tailwind CSS v4, most theme configuration has moved to globals.css
// using the @theme directive. This file only contains config that cannot
// be expressed in CSS (darkMode strategy, content paths).
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
