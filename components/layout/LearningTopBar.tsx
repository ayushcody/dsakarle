import React from 'react';
import Link from 'next/link';

export function LearningTopBar() {
  return (
    <header className="h-[64px] fixed top-0 right-0 left-0 md:left-[280px] bg-white border-b border-[var(--border)] z-40 flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-6">
        <Link href="/learn" className="font-dmsans text-[14px] text-[var(--accent-coral)] font-bold">Learn</Link>
        <Link href="/practice" className="hidden md:block font-dmsans text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Practice</Link>
        <Link href="/learn" className="hidden md:block font-dmsans text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Curriculum</Link>
        <Link href="/about" className="hidden md:block font-dmsans text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About</Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-dmsans text-sm font-medium">
          <span className="text-[var(--accent-coral)]">🔥</span> 12 day streak
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center font-dmsans text-xs font-bold text-[var(--text-primary)]">
          RM
        </div>
      </div>
    </header>
  );
}
