import Link from 'next/link'

import { Glyph, GlyphTile, glyphForSlug } from '@/components/glyph'
import { Chip } from '@/components/ui/Chip'
import type { ChipVariant } from '@/components/ui/Chip'
import { focusRing } from '@/components/ui/cn'
import { getGroup, getLessonMeta, lessonNumber, LESSONS } from '@/lib/curriculum'
import type { CurriculumLesson, TopicDifficulty } from '@/types/learning'

const DIFFICULTY: Record<TopicDifficulty, { label: string; variant: ChipVariant }> = {
  beginner: { label: 'Beginner', variant: 'teal' },
  intermediate: { label: 'Intermediate', variant: 'amber' },
  advanced: { label: 'Advanced', variant: 'coral' },
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.2 1.4" />
    </svg>
  )
}

/** Breadcrumb, glyph + title, the one-line shape sentence, and the quick facts. */
export function LessonHeader({ meta }: { meta: CurriculumLesson }) {
  const group = getGroup(meta.group)
  const difficulty = DIFFICULTY[meta.difficulty]
  const prereqs = meta.prereqs
    .map((slug) => getLessonMeta(slug))
    .filter((lesson): lesson is CurriculumLesson => Boolean(lesson))

  return (
    <header className="max-w-[760px]">
      <nav aria-label="Breadcrumb" className="t-caption mb-4 text-ink-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <li>{group?.title ?? 'Lessons'}</li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink-2">{meta.title}</li>
          <li aria-hidden="true">·</li>
          <li>
            {lessonNumber(meta.slug)} of {LESSONS.length}
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-4">
        <GlyphTile id={glyphForSlug(meta.slug)} tileSize={48} glyphSize={48} decorative />
        <h1 className="t-h1 min-w-0 text-balance text-ink">{meta.title}</h1>
      </div>

      <p className="t-body mt-4 text-[19px] leading-8 text-ink-2">{meta.oneLiner}</p>

      <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Lesson facts">
        <li>
          <Chip icon={<ClockIcon />}>{meta.minutes} min</Chip>
        </li>
        <li>
          <Chip variant={difficulty.variant}>{difficulty.label}</Chip>
        </li>
        {meta.status === 'draft' ? (
          <li>
            <Chip variant="amber">Draft</Chip>
          </li>
        ) : null}
        {prereqs.length > 0 ? (
          <>
            <li className="t-caption ml-1 text-ink-3">Builds on</li>
            {prereqs.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${lesson.slug}`}
                  className={`inline-flex min-h-[40px] items-center rounded-pill ${focusRing}`}
                >
                  <Chip icon={<Glyph id={lesson.glyph} size={16} decorative />} className="hover:border-rule-strong">
                    {lesson.title}
                  </Chip>
                </Link>
              </li>
            ))}
          </>
        ) : null}
      </ul>
    </header>
  )
}
