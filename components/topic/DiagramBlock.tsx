import React from 'react';

export default function DiagramBlock({ id }: { id: string }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] w-full min-h-[300px] flex items-center justify-center my-8 shadow-sm">
      <div className="text-[var(--text-muted)] font-dmsans text-sm flex flex-col items-center gap-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Diagram visual available in StepperBlock ({id})</span>
      </div>
    </div>
  );
}
