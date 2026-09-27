'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { CurriculumRoad, type RoadTopic } from '@/components/map/CurriculumRoad';

const PatternMap = dynamic(() => import('@/components/map/PatternMap'), {
  ssr: false,
  loading: () => <div className="skeleton mx-auto h-[70vh] w-full max-w-[1100px] rounded-[28px]" />,
});

export function MapViews({ topics }: { topics: RoadTopic[] }) {
  const [view, setView] = useState<'road' | 'graph'>('road');

  return (
    <div className="pb-24 pt-12">
      <div className="mx-auto mb-10 flex max-w-[1100px] flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-dmsans text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl text-balance">Your road to DSA mastery</h1>
          <p className="mt-3 max-w-xl font-dmsans text-lg text-[var(--text-secondary)]">
            Start in the village with the building blocks, cross the bridge, then climb the patterns that crack interviews.
          </p>
        </div>
        <div role="tablist" className="flex self-start rounded-full border border-[var(--border)] bg-[var(--white)] p-1 md:self-auto">
          {(['road', 'graph'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-5 py-2 font-dmsans text-sm font-bold transition-colors ${view === v ? 'bg-[var(--accent-coral)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {v === 'road' ? 'Road view' : 'Pattern graph'}
            </button>
          ))}
        </div>
      </div>
      {view === 'road' ? <CurriculumRoad topics={topics} /> : <div className="mx-auto h-[75vh] max-w-[1100px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--white)]"><PatternMap /></div>}
    </div>
  );
}
