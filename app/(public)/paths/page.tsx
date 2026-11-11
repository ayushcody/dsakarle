import type { Metadata } from 'next';
import Link from 'next/link';

import { PathCard } from '@/components/paths/PathCard';
import { pathMinutes } from '@/components/paths/format';
import { PATHS, getPath, pathLessons } from '@/lib/curriculum';

export const metadata: Metadata = {
  title: 'Paths | DSA Karle',
  description:
    'Four paths through data structures and algorithms: Foundations, Patterns, Trees and graphs, and Optimization. Start with Foundations, or jump to the path you need.',
};

const linkClass =
  'rounded-cell font-semibold text-coral-ink underline underline-offset-4 decoration-1 hover:decoration-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

export default function PathsPage() {
  const total = PATHS.reduce((sum, path) => sum + pathLessons(path.id).length, 0);
  const first = getPath('foundations') ?? PATHS[0];

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      <header>
        <h1 className="t-h1 text-ink">Paths</h1>
        <p className="t-body mt-3 max-w-[60ch] text-ink-2">
          {PATHS.length === 4 ? 'Four' : PATHS.length} paths, {total} lessons. Start with {first.title}, or jump to the
          path you need.
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-6 md:gap-8">
        {PATHS.map((path) => (
          <PathCard
            key={path.id}
            id={path.id}
            title={path.title}
            blurb={path.blurb}
            glyph={path.glyph}
            minutes={pathMinutes(path.id)}
            slugs={pathLessons(path.id).map((lesson) => lesson.slug)}
          />
        ))}
      </div>

      <aside aria-labelledby="not-sure" className="mt-12 border-t border-rule pt-8">
        <h2 id="not-sure" className="font-sans text-[16px] font-semibold text-ink">
          Not sure where to start?
        </h2>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-6 text-ink-2">
          Begin with <Link href={`/paths/${first.id}`} className={linkClass}>{first.title}</Link>. Every other path builds
          on it. Once you have a few lessons behind you, test yourself in the{' '}
          <Link href="/gym" className={linkClass}>Pattern gym</Link> or see how it all connects on the{' '}
          <Link href="/map" className={linkClass}>Pattern map</Link>.
        </p>
      </aside>
    </div>
  );
}
