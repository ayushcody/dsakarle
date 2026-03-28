'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { getChapterProgress, getProgress } from '@/lib/progress';
import type { CourseStructure, CourseStructureGroup } from '@/types/learning';

function completionDot(slug: string) {
  const progress = getProgress();
  if (progress.completedSections.includes(slug)) {
    return 'bg-[var(--accent-teal)]';
  }

  if (progress.quizScores[slug]?.recognition || progress.quizScores[slug]?.concept) {
    return 'bg-[var(--accent-amber)]';
  }

  return 'bg-[var(--border)]';
}

function GroupBlock({
  group,
  currentSlug,
  onNavigate,
}: {
  group: CourseStructureGroup
  currentSlug: string
  onNavigate?: () => void
}) {
  const chapterProgress = useMemo(
    () => getChapterProgress(group.topics.map((topic) => topic.slug)),
    [group.topics]
  );

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-dmsans text-sm font-semibold text-[var(--text-primary)]">{group.title}</h3>
        <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
          {chapterProgress}% complete
        </span>
      </div>
      <div className="space-y-2">
        {group.topics.map((topic) => {
          const active = topic.slug === currentSlug;
          return (
            <Link
              key={topic.slug}
              href={`/learn/${topic.slug}`}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors ${
                active ? 'border-l-2 border-[var(--accent-coral)] bg-[var(--surface-coral)]' : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${completionDot(topic.slug)}`} />
              <span className="font-dmsans text-sm text-[var(--text-primary)]">{topic.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({
  currentSlug,
  courseStructure,
  mode = 'desktop',
  open = false,
  onClose,
}: {
  currentSlug: string
  courseStructure: CourseStructure
  mode?: 'desktop' | 'drawer'
  open?: boolean
  onClose?: () => void
}) {
  if (mode === 'drawer') {
    return (
      <div
        className={`fixed inset-0 z-40 bg-[rgba(26,26,24,0.42)] transition-opacity lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label="Close course sidebar"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[86vw] max-w-[320px] overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-primary)] px-4 pb-6 pt-24 shadow-[var(--shadow-card-hover)] transition-transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Course Map
              </p>
              <p className="mt-1 font-dmsans text-sm text-[var(--text-secondary)]">
                Jump between patterns and topics.
              </p>
            </div>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2 font-dmmono text-xs text-[var(--text-primary)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="space-y-4">
            {courseStructure.groups.map((group) => (
              <GroupBlock key={group.title} group={group} currentSlug={currentSlug} onNavigate={onClose} />
            ))}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        {courseStructure.groups.map((group) => (
          <GroupBlock key={group.title} group={group} currentSlug={currentSlug} />
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
