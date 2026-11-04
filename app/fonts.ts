import { Caveat, DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';

/**
 * Weights below are the ones the UI actually uses (audited by grep):
 * - Fraunces: 400 (default), 500 (blockquotes), 600 (headings). No 700.
 * - DM Sans: 400, 500, 600, and 700 (font-bold in RightSidebar, CheckSection, badges).
 * - JetBrains Mono: 400, 500 (Kbd, index numerals), 600.
 * - Caveat: 500 only, handwritten callouts.
 * Re-check with `grep -rn "font-bold\|font-medium\|font-semibold"` before removing a weight.
 */

/**
 * Headings, display, the click sentence. Variable font with the optical-size axis only.
 * next/font rejects `axes` together with `weight`, so the wght range cannot be narrowed here.
 */
export const serif = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  variable: '--font-serif',
});

/** Body and UI. Above the fold on every page, so preloaded. */
export const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  variable: '--font-sans',
});

/** Code, values in cells, variables. Mostly below the fold (code blocks, keyboard hints), so not preloaded. */
export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
  variable: '--font-mono',
});

/** Handwritten callouts only. Preloaded (one small file) because the home hero caption is above the fold and swapped late otherwise (layout shift). */
export const hand = Caveat({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  variable: '--font-hand',
});

/** All four font-variable classes, ready for <html className>. */
export const fontVariables = [serif.variable, sans.variable, mono.variable, hand.variable].join(' ');
