'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    setMounted(true);
    setProgress(getProgress());
  }, []);

  // Calculate chapter progress only on client after mount
  function getChapterProgressSafe(slugs: string[]): number {
    if (!mounted || slugs.length === 0) return 0;
    const completed = slugs.filter((slug) => progress.completedSections.includes(slug)).length;
    return Math.round((completed / slugs.length) * 100);
  }

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: '64px',  // below navbar
      width: '280px',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      zIndex: 40,
      // Custom scrollbar
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--border) transparent',
    }}>
      <div style={{ padding: '20px 0 40px' }}>
        {courseStructure.groups.map((group, groupIndex) => {
          const chapterProgress = getChapterProgressSafe(group.topics.map((t) => t.slug));
          
          return (
            <div key={group.title}>
              {/* Group Header */}
              <div style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                borderTop: groupIndex > 0 ? '1px solid var(--border)' : 'none',
                padding: '12px 20px 10px',
                marginTop: groupIndex > 0 ? 16 : 0,
                zIndex: 10,
              }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  {group.title}
                </span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {mounted ? `${chapterProgress}% COMPLETE` : '—'}
                </span>
              </div>

              {/* Topics */}
              {group.topics.map(topic => {
                const isActive = topic.slug === currentSlug;
                const isComplete = mounted && progress.completedSections.includes(topic.slug);
                const hasQuiz = mounted && (progress.quizScores[topic.slug]?.recognition || progress.quizScores[topic.slug]?.concept);

                return (
                  <Link key={topic.slug} href={`/learn/${topic.slug}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 20px',
                    background: isActive ? 'rgba(212,96,58,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-coral)' : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}>
                    {/* Completion dot */}
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isComplete ? '#1D7A6B' : hasQuiz ? '#CA8A04' : '#D4D0C8',
                    }} />
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 14,
                      color: isActive ? 'var(--accent-coral)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                    }}>
                      {topic.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
