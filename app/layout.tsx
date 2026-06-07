import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSA Karle',
  description: 'A visual-first DSA learning platform where every algorithm concept is taught through scrubable step-by-step diagrams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-dmsans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
