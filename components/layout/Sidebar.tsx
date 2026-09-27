'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProgress } from '@/lib/progress';
import type { CourseStructure, ProgressData } from '@/types/learning';

const EMPTY_PROGRESS: ProgressData = {
  completedSections: [],
  quizScores: {},
  lastVisited: '',
};

export function Sidebar({
  currentSlug,
  courseStructure,
}: {
  currentSlug: string
  courseStructure: CourseStructure
}) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(EMPTY_PROGRESS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setProgress({ ...getProgress() });
    sync();
    window.addEventListener('dsakarle:progress', sync);
    return () => window.removeEventListener('dsakarle:progress', sync);
  }, []);

  useEffect(() => setOpen(false), [currentSlug]);

  // Calculate overall progress
  const totalTopics = courseStructure.groups.reduce((acc, group) => acc + group.topics.length, 0);
  const completedTopics = mounted ? progress.completedSections.length : 0;
  const overallProgress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  return (
    <>
    <button
      onClick={() => setOpen(true)}
      aria-label="Open course menu"
      className="md:hidden fixed bottom-5 left-5 z-40 h-12 px-5 rounded-full bg-[var(--accent-coral)] text-white font-dmsans font-bold text-sm shadow-lg"
    >
      ☰ Topics
    </button>
    {open && <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}
    <aside className={`fixed left-0 top-0 w-[280px] h-screen transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} bg-[var(--bg-secondary)] border-r border-[var(--border)] z-50 overflow-y-auto flex flex-col custom-scrollbar pb-10`}>
      
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Image src="/DSAKarle_Logo.png" alt="DSA Karle Logo" width={36} height={36} className="object-contain" />
          <div>
            <h2 className="font-dmsans font-bold text-xl text-[var(--text-primary)] leading-none tracking-tight">DSA Karle</h2>
            <p className="font-dmsans text-[11px] font-bold uppercase tracking-widest text-[var(--accent-coral)] mt-1">Technical Mastery</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-5 mb-6">
        <div className="bg-[var(--white)] border border-[var(--border)] rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-dmsans text-sm font-bold text-[var(--text-primary)]">Overall Progress</span>
            <span className="font-dmsans text-sm font-bold text-[var(--text-primary)]">{overallProgress}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-coral)] rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3">
        {courseStructure.groups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? "mt-6" : ""}>
            {/* Group Header */}
            <div className="px-3 mb-2 flex items-center justify-between">
              <h3 className="font-dmsans font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                {group.title}
              </h3>
            </div>

            {/* Topics */}
            <ul className="space-y-1">
              {group.topics.map(topic => {
                const isActive = topic.slug === currentSlug;
                const isComplete = mounted && progress.completedSections.includes(topic.slug);

                return (
                  <li key={topic.slug}>
                    <Link 
                      href={`/learn/${topic.slug}`} 
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-dmsans text-[14px] transition-all group ${
                        isActive 
                          ? 'bg-[var(--surface-coral)] text-[var(--accent-coral)] font-semibold' 
                          : 'text-[var(--text-secondary)] hover:bg-[var(--white)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {/* Status Indicator */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        isComplete 
                          ? 'bg-[var(--state-success)]' 
                          : isActive 
                            ? 'bg-[var(--accent-coral)]'
                            : 'bg-[var(--border-strong)] group-hover:bg-[var(--text-muted)]'
                      }`} />
                      <span className="truncate">{topic.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Practice Button */}
      <div className="px-5 mt-8">
        <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-1">Practice & Reinforce</h3>
        <p className="font-dmsans text-xs text-[var(--text-secondary)] mb-4">Solve curated problems related to this topic.</p>
        <Link href="/practice" className="block w-full py-2.5 px-4 text-center border border-[var(--accent-coral)] text-[var(--accent-coral)] font-dmsans font-bold text-sm rounded-lg hover:bg-[var(--accent-coral)] hover:text-white transition-colors">
          Start Practice &rarr;
        </Link>
      </div>

    </aside>
    </>
  );
}

export default Sidebar;
