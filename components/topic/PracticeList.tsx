'use client';
import React, { useState } from 'react';

interface PracticeItem {
  title: string;
  url: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patternTag: string;
}

interface PracticeListProps {
  items: PracticeItem[];
}

export default function PracticeList({ items }: PracticeListProps) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    const next = new Set(completed);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCompleted(next);
  };

  const badgeMap = {
    easy: 'badge-pill badge-pill-teal',
    medium: 'badge-pill badge-pill-amber',
    hard: 'badge-pill badge-pill-coral'
  };

  return (
    <div className="my-8 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white text-left shadow-[var(--shadow-card)]">
      <div className="surface-muted flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h3 className="font-dmsans font-bold text-[var(--text-primary)] text-lg">Practice Bank</h3>
        <span className="font-dmmono text-xs text-[var(--text-muted)] bg-white px-2.5 py-1 rounded border border-[var(--border)]">
          {completed.size} / {items.length} Completed
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[var(--border)]">
              <th className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-6 py-3 w-16 text-center">Done</th>
              <th className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-6 py-3">Problem</th>
              <th className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-6 py-3 w-32">Difficulty</th>
              <th className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-6 py-3 hidden sm:table-cell">Variant</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={`border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--bg-primary)] ${completed.has(idx) ? 'bg-[var(--bg-primary)]' : ''}`}>
                <td className="px-6 py-4 text-center">
                  <div 
                    onClick={() => toggle(idx)}
                    className={`mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-colors ${completed.has(idx) ? 'border-[var(--state-success)] bg-[var(--state-success)]' : 'border-[var(--text-inverse-muted)] bg-white hover:border-[var(--text-primary)]'}`}
                  >
                    {completed.has(idx) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a href={item.url} target="_blank" rel="noreferrer" className={`font-dmsans text-[15px] font-medium transition-colors ${completed.has(idx) ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)] hover:text-[var(--accent-coral)]'}`}>
                    {item.title}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`${badgeMap[item.difficulty]} whitespace-nowrap`}>
                    {item.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="font-dmsans text-xs text-[var(--text-secondary)] whitespace-nowrap bg-[var(--bg-secondary)] px-2.5 py-1 rounded">
                    {item.patternTag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
