import React from 'react';
import { LearningTopBar } from '@/components/layout/LearningTopBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LearningTopBar />
      <div className="flex-grow pt-[64px]">
        {children}
      </div>
    </>
  );
}
