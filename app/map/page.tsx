import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

import Navbar from '@/components/layout/Navbar';

const PatternMap = dynamic(() => import('@/components/map/PatternMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 64px)',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        color: 'var(--ink-3)',
      }}
    >
      Loading Pattern Map…
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'DSA Pattern Map | DSAKarle',
  description:
    'An interactive, zoomable map showing how all DSA patterns and data structures connect to each other.',
};

export default function MapPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[64px]">
        <PatternMap />
      </main>
    </>
  );
}
