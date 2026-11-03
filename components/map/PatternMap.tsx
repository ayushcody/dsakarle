'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Chip, SegmentedControl } from '@/components/ui';
import type { MapFilter } from './graph';
import MapListView from './MapListView';
import { MapLegend } from './MapLegend';

// d3 is only needed for the drawn map, so phones that open on the list never download it.
const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[420px] items-center justify-center rounded-card border border-rule bg-paper-raised text-[14px] text-ink-3"
      role="status"
    >
      Laying out the map…
    </div>
  ),
});

const FILTERS: Array<{ value: MapFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'data-structures', label: 'Data Structures' },
  { value: 'algorithms', label: 'Algorithms' },
  { value: 'live', label: 'Live only' },
];

type View = 'map' | 'list';

function initialView(): View {
  if (typeof window === 'undefined') return 'list';
  return window.matchMedia('(min-width: 768px)').matches ? 'map' : 'list';
}

/** Client-only (loaded with ssr: false), so reading the viewport for the default view is safe. */
export default function PatternMap() {
  const [view, setView] = useState<View>(initialView);
  const [filter, setFilter] = useState<MapFilter>('all');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter lessons" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Chip key={f.value} selectable selected={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <SegmentedControl<View>
          aria-label="View"
          className="self-start"
          value={view}
          onChange={setView}
          options={[
            { value: 'map', label: 'Map' },
            { value: 'list', label: 'List view' },
          ]}
        />
      </div>

      {view === 'map' ? (
        <>
          <MapLegend />
          <MapCanvas filter={filter} />
        </>
      ) : (
        <MapListView filter={filter} />
      )}
    </div>
  );
}
