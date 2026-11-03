import { GlyphTile } from '@/components/glyph';
import { Card, Chip, cn } from '@/components/ui';
import { CURRICULUM, LESSONS, lessonsInGroup } from '@/lib/curriculum';
import type { CurriculumLesson } from '@/types/learning';

import { Reveal } from './Reveal';

function LessonCard({ lesson }: { lesson: CurriculumLesson }) {
  const live = lesson.status === 'live';
  return (
    <Card
      as="a"
      href={`/learn/${lesson.slug}`}
      interactive
      padding="sm"
      className={cn('group flex h-full flex-col gap-3', live && '!border-coral [background-image:linear-gradient(var(--coral-wash),var(--coral-wash))]')}
    >
      <div className="flex items-start justify-between gap-3">
        <GlyphTile id={lesson.glyph} tileSize={48} glyphSize={48} decorative />
        {live ? (
          <Chip variant="coral">Live</Chip>
        ) : (
          <Chip variant="neutral" title="Draft — reading notes, walkthrough coming">
            Draft<span className="sr-only"> — reading notes, walkthrough coming</span>
          </Chip>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h4 className="t-h3 text-ink">{lesson.title}</h4>
        <p className="t-small text-ink-2">{lesson.oneLiner}</p>
      </div>
      <p
        className={cn(
          't-caption min-h-[36px] text-ink-3 transition-opacity duration-150',
          'lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
        )}
      >
        <span className="font-semibold text-ink-2">When:</span> {lesson.trigger}
      </p>
      <p className="t-caption text-ink-3">{lesson.minutes} min</p>
    </Card>
  );
}

export function PatternShelf() {
  const live = LESSONS.filter((l) => l.status === 'live').length;
  return (
    <section id="lessons" aria-labelledby="shelf-title" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <Reveal>
        <p className="t-eyebrow">The pattern shelf</p>
        <h2 id="shelf-title" className="t-h1 mt-3 max-w-[22ch] text-ink">
          {LESSONS.length} lessons, one clue each.
        </h2>
        <p className="t-body mt-4 max-w-[44rem] text-ink-2">
          Every card tells you what the idea is and the clue in a problem that says to use it.{' '}
          {live === 1 ? 'One lesson has' : `${live} lessons have`} the full step-by-step walkthrough today. The rest
          are <strong className="font-semibold text-ink">Draft</strong>: reading notes for now, walkthrough on the way.
        </p>
      </Reveal>

      <div className="mt-12 flex flex-col gap-16">
        {CURRICULUM.groups.map((group) => {
          const items = lessonsInGroup(group.id);
          return (
            <Reveal key={group.id}>
              <div className="mb-6 flex flex-col gap-1">
                <h3 className="t-h2 text-ink">{group.title}</h3>
                <p className="t-small text-ink-3">{group.blurb}</p>
              </div>
              <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((lesson) => (
                  <li key={lesson.slug} className="min-w-0">
                    <LessonCard lesson={lesson} />
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
