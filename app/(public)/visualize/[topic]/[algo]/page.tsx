import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GlyphTile } from '@/components/glyph'
import { Stage } from '@/components/stage/Stage'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import { cn, focusRing } from '@/components/ui'
import { renderCode } from '@/lib/code/render'
import { getVisual, visualEntries, visualNeighbours } from '@/lib/visualize'

interface PageProps {
  params: { topic: string; algo: string }
}

export function generateStaticParams() {
  return visualEntries().map((e) => ({ topic: e.topic, algo: e.algo }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const entry = getVisual(params.topic, params.algo)
  if (!entry) return { title: 'Visualization not found — DSA Karle' }
  return {
    title: `${entry.label} · ${entry.lessonTitle} — Visualize — DSA Karle`,
    description: `Watch ${entry.lessonTitle} (${entry.label}) run step by step, predict the next move, and try your own input. From the ${entry.lessonTitle} lesson.`,
    alternates: { canonical: `/visualize/${entry.topic}/${entry.algo}` },
  }
}

const crumbLink = cn(
  '-my-3 inline-flex min-h-10 items-center rounded-cell hover:text-coral-ink hover:underline underline-offset-4',
  focusRing,
)

export default async function VisualPage({ params }: PageProps) {
  const entry = getVisual(params.topic, params.algo)
  if (!entry) notFound()

  let code: Record<string, RenderedCodeProp> = {}
  try {
    code = { [entry.tracer]: await renderCode(entry.tracer) }
  } catch (error) {
    console.error(`[visualize/${entry.tracer}] could not render code:`, error)
  }

  const siblings = visualEntries().filter((e) => e.lessonSlug === entry.lessonSlug && e.tracer !== entry.tracer)
  const { prev, next } = visualNeighbours(entry.tracer)

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pb-24 pt-8 sm:px-6 md:pt-10">
      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-3">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/visualize" className={crumbLink}>
              Visualize
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>{entry.pathTitle}</li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink-2">
            {entry.lessonTitle}
          </li>
        </ol>
      </nav>

      <header className="mt-6 flex items-start gap-4">
        <GlyphTile id={entry.glyph} tileSize={48} glyphSize={48} decorative />
        <div className="min-w-0">
          <p className="t-eyebrow">{entry.lessonTitle}</p>
          <h1 className="t-h1 mt-1 text-ink">{entry.label}</h1>
          <p className="t-body mt-2 max-w-[66ch] text-ink-2">
            From the{' '}
            <Link href={`/learn/${entry.lessonSlug}`} className="font-semibold text-coral-ink underline underline-offset-4">
              {entry.lessonTitle}
            </Link>{' '}
            lesson: {entry.lessonOneLiner}
          </p>
        </div>
      </header>

      <p className="mt-6 text-[14px] leading-6 text-ink-3">
        Step with → or Next. When a question pops up, make your guess. Switch to “Try your own” to run it on your input.
      </p>
      <div className="mt-4">
        <Stage tracks={[entry.track]} playground code={code} />
      </div>

      {siblings.length > 0 ? (
        <section aria-labelledby="more" className="mt-14">
          <h2 id="more" className="font-sans text-[18px] font-semibold text-ink">
            More from {entry.lessonTitle}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {siblings.map((s) => (
              <li key={s.tracer}>
                <Link
                  href={`/visualize/${s.topic}/${s.algo}`}
                  className={cn('flex min-h-[52px] items-center rounded-card border border-rule bg-paper-raised px-4 py-3 text-[15px] font-medium text-ink hover:border-rule-strong hover:bg-paper-sunken', focusRing)}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="More visualizations" className="mt-12 grid gap-3 border-t border-rule pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/visualize/${prev.topic}/${prev.algo}`}
            className={cn('rounded-card border border-rule bg-paper-raised p-4 hover:border-rule-strong hover:bg-paper-sunken', focusRing)}
          >
            <span className="t-eyebrow block">← Previous</span>
            <span className="mt-1 block text-[16px] font-semibold text-ink">{prev.label}</span>
            <span className="block text-[13px] text-ink-3">{prev.lessonTitle}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/visualize/${next.topic}/${next.algo}`}
            className={cn('rounded-card border border-rule bg-paper-raised p-4 text-right hover:border-rule-strong hover:bg-paper-sunken', focusRing)}
          >
            <span className="t-eyebrow block">Next →</span>
            <span className="mt-1 block text-[16px] font-semibold text-ink">{next.label}</span>
            <span className="block text-[13px] text-ink-3">{next.lessonTitle}</span>
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
