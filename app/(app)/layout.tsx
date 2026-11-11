import React from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div id="main-content" className="flex-grow pt-16 focus:outline-none">
        {children}
      </div>
    </>
  );
}
