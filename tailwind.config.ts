import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // NOTE: `dark:` utilities only fire for an explicit data-theme="dark". When the theme is
  // "system" the dark palette comes from a prefers-color-scheme media query that Tailwind's
  // `dark:` variant cannot see. Prefer the CSS-variable tokens (bg-paper, text-ink ...), which
  // switch in every case, and avoid `dark:` wherever possible.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        hand: ['var(--font-hand)', 'cursive'],
        // Temporary aliases until the legacy sweep.
        dmsans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        dmmono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        lora: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      colors: {
        background: 'var(--paper)',
        foreground: 'var(--ink)',
        paper: 'var(--paper)',
        'paper-raised': 'var(--paper-raised)',
        'paper-sunken': 'var(--paper-sunken)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        rule: 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        coral: 'var(--coral)',
        'coral-ink': 'var(--coral-ink)',
        'coral-wash': 'var(--coral-wash)',
        amber: 'var(--amber)',
        teal: 'var(--teal)',
        'role-ptr-a': 'var(--role-ptr-a)',
        'role-ptr-b': 'var(--role-ptr-b)',
        'role-focus': 'var(--role-focus)',
        'role-compare': 'var(--role-compare)',
        'role-found': 'var(--role-found)',
        'role-error': 'var(--role-error)',
      },
      borderRadius: {
        cell: 'var(--r-cell)',
        card: 'var(--r-card)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
      },
    },
  },
  plugins: [],
};
export default config;
