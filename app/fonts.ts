import { Caveat, DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';

/** Headings, display, the click sentence. Variable font with the optical-size axis. */
export const serif = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-serif',
});

/** Body and UI. */
export const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

/** Code, values in cells, variables. */
export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

/** Handwritten callouts only. Never body text. */
export const hand = Caveat({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
  variable: '--font-hand',
});

/** All four font-variable classes, ready for <html className>. */
export const fontVariables = [serif.variable, sans.variable, mono.variable, hand.variable].join(' ');
