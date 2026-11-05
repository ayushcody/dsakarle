import Link from 'next/link'

import { Glyph, glyphForSlug } from '@/components/glyph'
import { focusRing } from '@/components/ui/cn'
import { placeOf } from '@/lib/curriculum'
import type { CurriculumLesson, TopicDifficulty } from '@/types/learning'

const DIFFICULTY: Record<TopicDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const crumb = `rounded-cell hover:text-ink hover:underline hover:underline-offset-4 ${focusRing}`

/** Breadcrumb, title, one meta line and the lead sentence. */
export function LessonHeader({ meta }: { meta: CurriculumLesson }) {
  const place = placeOf(meta.slug)
  const where = place ? `Lesson ${place.number} of ${place.total} in ${place.path.title}` : 'Lesson'

  return (
    <header className="mx-auto max-w-[720px]">
      {place ? (
        <nav aria-label="Breadcrumb" className="t-caption mb-4 text-ink-3">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0">
            <li aria-hidden="true" className="inline-flex">
              <Glyph id={glyphForSlug(meta.slug)} size={24} decorative />
            </li>
            <li>
              <Link href={`/paths/${place.path.id}`} className={crumb}>
                {place.path.title}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={`/paths/${place.path.id}#${slugify(place.section.title)}`} className={crumb}>
                {place.section.title}
              </Link>
            </li>
          </ol>
        </nav>
      ) : null}

      <h1 className="t-h1 text-balance text-ink">{meta.title}</h1>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[14px] leading-6 text-ink-3">
        <span>
          {where} · {meta.minutes} min · {DIFFICULTY[meta.difficulty]}
        </span>
        {meta.status === 'draft' ? (
          <span className="rounded-cell border border-rule px-1.5 text-[12px] text-ink-3">Draft</span>
        ) : null}
      </p>

      <p className="mt-5 text-[18px] leading-8 text-ink-2">{meta.oneLiner}</p>
    </header>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
