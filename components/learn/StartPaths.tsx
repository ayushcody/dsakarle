import Link from 'next/link';

import { cn, focusRing } from '@/components/ui';
import { getLessonMeta } from '@/lib/curriculum';
import { START_PATHS } from './paths';

/** "Where to start?" Three suggested reading orders, built from curriculum slugs. */
export function StartPaths() {
  return (
    <section aria-labelledby="start-heading" className="rounded-card border border-rule bg-paper-raised p-5 shadow-1 sm:p-6">
      <h2 id="start-heading" className="t-h3 text-ink">
        Where to start?
      </h2>
      <p className="t-small mt-1 text-ink-2">Pick the path closest to you. Each step is a lesson, in order.</p>

      <ol className="mt-5 grid gap-6 md:grid-cols-3 md:gap-8">
        {START_PATHS.map((path) => (
          <li key={path.id}>
            <h3 className="font-sans text-[15px] font-semibold text-ink">{path.title}</h3>
            <p className="t-small mt-0.5 text-ink-2">{path.blurb}</p>
            <ol className="mt-3 space-y-0.5">
              {path.slugs.map((slug, index) => {
                const lesson = getLessonMeta(slug);
                if (!lesson) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/learn/${slug}`}
                      className={cn(
                        focusRing,
                        '-mx-2 flex min-h-[44px] items-center gap-3 rounded-cell px-2 text-[15px] text-ink',
                        'transition-colors duration-150 hover:bg-coral-wash hover:text-coral-ink',
                      )}
                    >
                      <span aria-hidden="true" className="w-4 shrink-0 text-right font-mono text-[12px] text-ink-3">
                        {index + 1}
                      </span>
                      <span>{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
