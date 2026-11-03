import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

import { SiteHeader } from '@/components/layout/SiteHeader';

const PatternMap = dynamic(() => import('@/components/map/PatternMap'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-[420px] items-center justify-center rounded-card border border-rule bg-paper-raised text-[14px] text-ink-3"
    >
      Loading the map…
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Pattern map | DSA Karle',
  description:
    'How data structures and patterns connect. Arrows point from what to learn first; dashed lines mark related ideas.',
};

export default function MapPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-grow pt-[64px]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
          <header className="mb-8">
            <p className="t-eyebrow">Map</p>
            <h1 className="t-h1 mt-2 text-ink">Pattern map</h1>
            <p className="t-body mt-3 max-w-[60ch] text-ink-2">
              How the ideas connect. Arrows point from what to learn first.
            </p>
          </header>
          <PatternMap />
        </div>
      </main>
    </>
  );
}
