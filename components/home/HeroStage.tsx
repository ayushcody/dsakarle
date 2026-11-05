'use client';

import dynamic from 'next/dynamic';

import type { StageTrack } from '@/types/learning';

/** Measured height of the paused hero Stage (about 640px on phones, 572px from 640w, 594px from 1024w). The skeleton and the wrapper reserve it so nothing jumps. */
const STAGE_BOX = 'min-h-[640px] sm:min-h-[572px] lg:min-h-[594px]';

function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`flex items-center justify-center rounded-card bg-paper-sunken ${STAGE_BOX}`}
    >
      <p className="text-[15px] text-ink-3">Getting the demo ready…</p>
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

/** A real, paused run of the sliding-window tracer inside the hero card. Never autoplays. */
export function HeroStage() {
  return (
    <div className={STAGE_BOX}>
      <Stage variant="hero" tracks={TRACKS} playground={false} />
    </div>
  );
}
