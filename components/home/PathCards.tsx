import Link from 'next/link';

import { GlyphTile } from '@/components/glyph';
import { Card, focusRing, cn } from '@/components/ui';
import { LESSONS, PATHS, pathLessons } from '@/lib/curriculum';

import { Reveal } from './Reveal';

export function PathCards() {
  return (
    <section id="paths" aria-labelledby="paths-title" className="border-t border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="paths-title" className="t-h1 text-ink">
                Choose a path
              </h2>
              <p className="t-body mt-3 max-w-[40rem] text-ink-2">
                Start at the beginning, or jump to what you need. Each path is a short run of lessons.
              </p>
            </div>
            <Link
              href="/paths"
              className={cn(
                'inline-flex min-h-[40px] shrink-0 items-center self-start rounded-cell px-1 text-[15px] font-semibold text-coral-ink underline underline-offset-4 sm:self-auto',
                focusRing,
              )}
            >
              All {LESSONS.length} lessons
              <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        </Reveal>

        <Reveal>
          <ul className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2">
            {PATHS.map((path) => {
              const count = pathLessons(path.id).length;
              return (
                <li key={path.id} className="min-w-0">
                  <Card as="a" href={`/paths/${path.id}`} interactive padding="md" className="group flex h-full flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <GlyphTile id={path.glyph} tileSize={56} glyphSize={48} decorative />
                      <div className="min-w-0">
                        <p className="t-eyebrow">Path</p>
                        <h3 className="t-h3 text-ink">{path.title}</h3>
                      </div>
                    </div>
                    <p className="t-caption text-ink-3">
                      {count} {count === 1 ? 'lesson' : 'lessons'}
                    </p>
                    <p className="t-small flex-1 text-ink-2">{path.blurb}</p>
                    <span className="inline-flex min-h-[40px] items-center text-[15px] font-semibold text-coral-ink">
                      Explore<span className="sr-only">&nbsp;{path.title}</span>
                      <span aria-hidden="true" className="ml-1 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5">→</span>
                    </span>
                  </Card>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
