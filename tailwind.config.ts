import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        lora: ['var(--font-lora)'],
        dmsans: ['var(--font-dmsans)'],
        dmmono: ['var(--font-dmmono)'],
      },
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
      },
    },
  },
  plugins: [],
};
export default config;
