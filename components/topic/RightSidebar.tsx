import React from 'react';
import Link from 'next/link';

export function RightSidebar() {
  return (
    <aside className="w-[280px] hidden lg:block flex-shrink-0 relative">
      <div className="sticky top-[88px] flex flex-col gap-8">
        
        {/* Lesson Outline */}
        <div>
          <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-4">Lesson Outline</h3>
          <ul className="space-y-3">
            {['1. Intuition', '2. Core Idea', '3. Step-by-Step Walkthrough', '4. Implementation', '5. Complexity Analysis', '6. Common Mistakes', '7. Practice Problems'].map((item, i) => (
              <li key={item}>
                <Link href="#" className={`font-dmsans text-sm block px-3 py-2 rounded-md transition-colors ${i === 0 ? 'bg-[var(--accent-coral)] bg-opacity-10 text-[var(--accent-coral)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Your Progress */}
        <div>
          <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-4">Your Progress</h3>
          <div className="bg-[var(--white)] border border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
            {/* Fake SVG Circle Progress */}
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-[var(--bg-secondary)]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[var(--accent-coral)]"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="60, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-dmsans font-bold text-xl text-[var(--text-primary)]">60%</span>
                <span className="font-dmsans text-[8px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Completed</span>
              </div>
            </div>
            <p className="font-dmsans text-xs text-[var(--text-secondary)] font-medium">3 / 5 sections done</p>
          </div>
        </div>

        {/* Study Tip */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[var(--accent-amber)]">💡</span>
            <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)]">Study Tip</h3>
          </div>
          <p className="font-dmsans text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            Try solving one easy problem now to lock in the concept!
          </p>
          <Link href="/practice" className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--accent-coral)] text-[var(--accent-coral)] font-dmsans font-bold text-xs rounded-md hover:bg-[var(--accent-coral)] hover:text-[var(--white)] transition-colors">
            Solve Problem &rarr;
          </Link>
        </div>

      </div>
    </aside>
  );
}
