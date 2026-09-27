'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getPracticeState } from '@/lib/practiceProgress';

import { SearchTrigger, ThemeToggle } from './Navbar';

export function LearningTopBar() {
  const [streak, setStreak] = useState(0);
  useEffect(() => setStreak(getPracticeState().streak), []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-[64px] items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)]/85 px-4 backdrop-blur-[12px] sm:px-6 md:left-[280px]">
      <div className="flex items-center gap-6">
        <Link href="/learn" className="font-dmsans text-[14px] font-bold text-[var(--accent-coral)]">Learn</Link>
        <Link href="/practice" className="hidden font-dmsans text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] md:block">Practice</Link>
        <Link href="/map" className="hidden font-dmsans text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] md:block">Roadmap</Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {streak > 0 && (
          <span className="hidden font-dmsans text-sm font-medium text-[var(--text-primary)] tabular-nums sm:inline">
            🔥 {streak} day streak
          </span>
        )}
        <SearchTrigger />
        <ThemeToggle />
      </div>
    </header>
  );
}
