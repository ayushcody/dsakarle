import type { Metadata } from 'next';
import './globals.css';
import { fontVariables } from './fonts';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dsakarle.vercel.app'),
  title: 'DSA Karle',
  description:
    'Learn data structures and algorithms by watching them run: visual, step-through lessons you can scrub, predict and try on your own input.',
};

// Runs before first paint so the chosen theme never flashes. Mirrors components/ui/ThemeToggle.tsx.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('dsakarle-theme');var d=document.documentElement;if(t==='light'||t==='dark'){d.setAttribute('data-theme',t)}else{d.removeAttribute('data-theme')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-paper text-ink-2 min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
