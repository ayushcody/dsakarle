import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'DSAKarle | DSA? Karle.',
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
        <Navbar />
        <main className="flex-grow pt-[64px] flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
