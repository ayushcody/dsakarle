import React from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex flex-grow flex-col pt-16 focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
