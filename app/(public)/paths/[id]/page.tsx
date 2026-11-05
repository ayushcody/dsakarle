import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PathHeaderProgress } from '@/components/paths/PathHeaderProgress';
import { LessonRows } from '@/components/paths/LessonRows';
import { lessonWord, pathMinutes } from '@/components/paths/format';
import { GlyphTile } from '@/components/glyph';
import { PATHS, getPath, pathLessons } from '@/lib/curriculum';

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return PATHS.map((path) => ({ id: path.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const path = getPath(params.id);
  if (!path) return { title: 'Path not found | DSA Karle' };
  return { title: `${path.title} | Paths | DSA Karle`, description: path.blurb };
}

export default function PathPage({ params }: PageProps) {
  const path = getPath(params.id);
  if (!path) notFound();

  const lessons = pathLessons(path.id);
  const slugs = lessons.map((lesson) => lesson.slug);
  const index = PATHS.findIndex((p) => p.id === path.id);
  const nextPath = PATHS[index + 1];

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-8 sm:px-6 md:pt-10">
      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-3">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/paths" className="-my-3 inline-flex min-h-10 min-w-10 items-center rounded-cell hover:text-coral-ink hover:underline underline-offset-4">
              Paths
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink-2">{path.title}</li>
        </ol>
      </nav>

      <header className="mt-6">
        <div className="flex items-center gap-4">
          <GlyphTile id={path.glyph} tileSize={48} glyphSize={48} decorative />
          <h1 className="t-h1 text-ink">{path.title}</h1>
        </div>
        <p className="t-body mt-5 max-w-[62ch] text-ink-2">{path.blurb}</p>
        <p className="mt-3 text-[14px] text-ink-3">
          {lessons.length} {lessonWord(lessons.length)} · {pathMinutes(path.id)} min
        </p>
        <PathHeaderProgress slugs={slugs} />
      </header>

      <div className="mt-12 flex flex-col gap-10">
        {path.sections.map((section) => {
          const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return (
            <section key={id} aria-labelledby={id}>
              <h2
                id={id}
                className="anchor-heading mb-4 scroll-mt-24 font-sans text-[20px] font-semibold leading-8 text-ink"
              >
                <a href={`#${id}`}>{section.title}</a>
              </h2>
              <LessonRows
                allSlugs={slugs}
                lessons={section.lessons.map((slug) => {
                  const l = lessons.find((x) => x.slug === slug)!;
                  return { slug: l.slug, title: l.title, oneLiner: l.oneLiner, minutes: l.minutes, difficulty: l.difficulty };
                })}
              />
            </section>
          );
        })}
      </div>

      {nextPath ? (
        <Link
          href={`/paths/${nextPath.id}`}
          className="group mt-14 flex items-center gap-4 rounded-card border border-rule bg-paper-raised p-5 hover:border-rule-strong hover:bg-paper-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          <GlyphTile id={nextPath.glyph} tileSize={48} glyphSize={48} decorative />
          <span className="min-w-0 flex-1">
            <span className="t-eyebrow block">Next path</span>
            <span className="block text-[18px] font-semibold leading-7 text-ink">{nextPath.title} →</span>
            <span className="block text-[14px] leading-5 text-ink-3">{nextPath.blurb}</span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
