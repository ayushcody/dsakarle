import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'DSA Karle — Master Data Structures & Algorithms',
  description: 'Visual, interactive DSA learning platform for engineering students.',
  openGraph: {
    title: 'DSA Karle',
    description: 'Learn every data structure and algorithm through step-by-step visual diagrams, quizzes, and curated LeetCode practice.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  keywords: ['DSA', 'data structures', 'algorithms', 'leetcode', 'competitive programming'],
};

const THEME_SCRIPT = `try{if(localStorage.getItem('dsakarle_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-dmsans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
