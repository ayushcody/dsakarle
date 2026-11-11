import localFont from 'next/font/local';

/**
 * Fonts are self-hosted (app/fonts/*.woff2, latin subset, SIL Open Font License,
 * from the Fontsource builds). Loading them from Google at build time failed on
 * Vercel ("An error occurred in `next/font`"), so the build never fetches fonts.
 *
 * Weights the UI actually uses (audited by grep):
 * - Fraunces: 400 (default), 500 (blockquotes), 600 (headings). Variable, with the optical-size axis.
 * - Inter: variable 100–900; the UI uses 400, 500, 600, 700.
 * - JetBrains Mono: variable 100–800; the UI uses 400, 500 (Kbd, index numerals), 600.
 * - Caveat: 500 only, handwritten callouts.
 */

/** Display only (.t-display, the home hero headline): the one serif brand moment, hence the LCP preload. */
export const serif = localFont({
  src: './fonts/Fraunces-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-serif',
  fallback: ['Georgia', 'serif'],
});

/** Headings, body and UI (the Odin Project look). Above the fold on every page, so preloaded. */
export const sans = localFont({
  src: './fonts/Inter-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

/** Code, values in cells, variables. Mostly below the fold (code blocks, keyboard hints), so not preloaded. */
export const mono = localFont({
  src: './fonts/JetBrainsMono-Variable.woff2',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  preload: false,
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

/** Handwritten callouts only. Preloaded (one small file) because the home hero caption is above the fold and swapped late otherwise (layout shift). */
export const hand = localFont({
  src: './fonts/Caveat-500.woff2',
  weight: '500',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-hand',
  fallback: ['cursive'],
});

/** All four font-variable classes, ready for <html className>. */
export const fontVariables = [serif.variable, sans.variable, mono.variable, hand.variable].join(' ');
