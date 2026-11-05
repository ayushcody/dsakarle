'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cn, focusRing } from '@/components/ui/cn'
import { getNeighbours } from '@/lib/curriculum'
import { getProgress, markComplete, subscribeProgress, unmarkComplete } from '@/lib/progress'

const REPO = 'https://github.com/ayushcody/dsakarle'

function NavButton({ href, direction, title }: { href?: string; direction: 'prev' | 'next'; title?: string }) {
  const label = direction === 'prev' ? 'Previous lesson' : 'Next lesson'
  const arrow = (
    <span aria-hidden="true" className="text-ink-3">
      {direction === 'prev' ? '←' : '→'}
    </span>
  )
  if (!href || !title) {
    return <div aria-hidden="true" />
  }
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-[64px] flex-col justify-center gap-0.5 rounded-card border border-rule bg-paper-raised px-4 py-2 transition-colors hover:border-rule-strong hover:bg-paper-sunken',
        direction === 'next' ? 'items-end text-right' : 'items-start text-left',
        focusRing,
      )}
    >
      <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        {direction === 'prev' ? arrow : null}
        {label}
        {direction === 'next' ? arrow : null}
      </span>
      <span className="text-[14px] leading-5 text-ink-2">{title}</span>
    </Link>
  )
}

/** Mark-complete (toggles), a symmetric Previous / Next pair, and quiet utility links. */
export function LessonFooter({ slug, title }: { slug: string; title: string }) {
  const { prev, next } = getNeighbours(slug)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const sync = () => setComplete(getProgress().completedSections.includes(slug))
    sync()
    return subscribeProgress(sync)
  }, [slug])

  return (
    <footer aria-label="Finish this lesson" className="mx-auto max-w-[720px] border-t border-rule pt-10">
      <div className="flex flex-col items-stretch gap-2">
        {complete ? (
          <Button size="lg" variant="secondary" onClick={() => unmarkComplete(slug)} className="w-full">
            Completed ✓ — undo
          </Button>
        ) : (
          <Button size="lg" onClick={() => markComplete(slug)} className="w-full">
            Mark lesson complete
          </Button>
        )}
        <p role="status" className="t-small text-center text-ink-3">
          {complete ? 'Saved on this device.' : 'Progress is saved on this device.'}
        </p>
      </div>

      <nav aria-label="Lesson navigation" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NavButton direction="prev" href={prev ? `/learn/${prev.slug}` : undefined} title={prev?.title} />
        <NavButton direction="next" href={next ? `/learn/${next.slug}` : undefined} title={next?.title} />
      </nav>
      {!next ? <p className="mt-6 text-center text-[16px] text-ink-2">That is the last lesson. Nicely done.</p> : null}

      <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink-3">
        <a
          href={`${REPO}/blob/main/content/topics/${slug}.json`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-[40px] items-center rounded-cell underline underline-offset-4 hover:text-ink ${focusRing}`}
        >
          Edit this lesson on GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a
          href={`${REPO}/issues/new?title=${encodeURIComponent(`Lesson: ${title}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-[40px] items-center rounded-cell underline underline-offset-4 hover:text-ink ${focusRing}`}
        >
          Report an issue<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </footer>
  )
}
