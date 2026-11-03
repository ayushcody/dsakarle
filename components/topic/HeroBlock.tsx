import Link from 'next/link';

import { getBadgeForSlug } from '@/components/badges/registry';
import type { LearningTopicPage } from '@/types/learning';

const CATEGORY_LABELS: Record<LearningTopicPage['category'], string> = {
  'data-structure': 'Data Structures',
  algorithm: 'Algorithms',
};

export function HeroBlock({ topic }: { topic: LearningTopicPage }) {
  const Badge = getBadgeForSlug(topic.slug);
  const difficultyClass = {
    beginner: 'badge-pill badge-pill-teal',
    intermediate: 'badge-pill badge-pill-amber',
    advanced: 'badge-pill badge-pill-coral',
  }[topic.difficulty];

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-10 shadow-[var(--shadow-card)]">
      <nav aria-label="Breadcrumb" className="mb-6 font-dmsans text-[13px] font-medium text-[var(--text-muted)]">
        <Link href="/learn" className="hover:text-[var(--text-primary)] transition-colors">
          {CATEGORY_LABELS[topic.category] ?? 'Topics'}
        </Link>
        <span className="mx-2" aria-hidden="true">&gt;</span>
        <span className="text-[var(--text-primary)]" aria-current="page">{topic.title}</span>
      </nav>
      <Badge className="h-[120px] w-[120px]" />
      <h1 className="mt-6 font-lora text-5xl font-bold text-[var(--text-primary)]">{topic.title}</h1>
      <p className="mt-4 max-w-3xl font-dmsans text-[18px] leading-relaxed text-[var(--text-secondary)]">
        {topic.overview.summary}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className={difficultyClass}>{topic.difficulty}</span>
        <span className="badge-pill badge-pill-dark">{topic.estimatedMinutes} min</span>
      </div>
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {topic.overview.learningObjectives.map((objective) => (
          <li key={objective} className="flex gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent-coral)]" />
            <span className="font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{objective}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
