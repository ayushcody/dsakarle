'use client';

import dynamic from 'next/dynamic';

import type { StageTrack } from '@/types/learning';

/** Measured height of the paused hero Stage (370px at 375w, 384px at 768w and up). The skeleton and the wrapper reserve it so nothing jumps. */
const STAGE_BOX = 'min-h-[370px] sm:min-h-[384px]';

function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`graph-paper flex items-center justify-center rounded-card border border-rule shadow-1 ${STAGE_BOX}`}
    >
      <p className="font-serif text-[18px] text-ink-3">Getting the demo ready…</p>
    </div>
  );
}

// The Stage is the only heavy client piece on the home page, so it loads on its own.
const Stage = dynamic(() => import('@/components/stage/Stage').then((m) => m.Stage), {
  ssr: false,
  loading: () => <Skeleton />,
});

const TRACKS: StageTrack[] = [
  {
    id: 'fixed',
    label: 'Fixed window',
    tracer: 'sliding-window/max-sum-k',
    predict: { tags: ['expand-or-shrink'], max: 1 },
  },
];

/** A real, paused run of the sliding-window tracer on a graph-paper card. Never autoplays. */
export function HeroStage() {
  return (
    <div className={STAGE_BOX}>
      <Stage variant="hero" tracks={TRACKS} playground={false} />
    </div>
  );
}
