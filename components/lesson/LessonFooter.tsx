'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Glyph, GlyphTile, glyphForSlug } from '@/components/glyph'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { focusRing } from '@/components/ui/cn'
import { getNeighbours } from '@/lib/curriculum'
import { getProgress, markComplete, subscribeProgress } from '@/lib/progress'

/** Mark-complete, the next lesson card, and a link back to the previous one. */
export function LessonFooter({ slug }: { slug: string }) {
  const { prev, next } = getNeighbours(slug)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const sync = () => setComplete(getProgress().completedSections.includes(slug))
    sync()
    return subscribeProgress(sync)
  }, [slug])

  return (
    <footer aria-label="Finish this lesson" className="max-w-[760px] border-t border-rule pt-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={complete ? 'secondary' : 'primary'}
          onClick={() => markComplete(slug)}
          disabled={complete}
        >
          {complete ? 'Lesson complete ✓' : 'Mark lesson complete'}
        </Button>
        <span role="status" className="t-small text-ink-3">
          {complete ? 'Saved on this device.' : 'Saved on this device when you do.'}
        </span>
      </div>

      {next ? (
        <Card as="a" href={`/learn/${next.slug}`} interactive className="mt-8">
          <p className="t-eyebrow mb-3">Up next</p>
          <div className="flex items-center gap-4">
            <GlyphTile id={glyphForSlug(next.slug)} tileSize={48} glyphSize={48} decorative />
            <div className="min-w-0 flex-1">
              <p className="t-h3 text-ink">{next.title}</p>
              <p className="mt-1 text-[15px] leading-6 text-ink-2">{next.oneLiner}</p>
            </div>
            <span aria-hidden="true" className="text-[20px] text-coral-ink">→</span>
          </div>
        </Card>
      ) : (
        <p className="mt-8 font-serif text-[20px] text-ink">That is the last lesson. Nicely done.</p>
      )}

      {prev ? (
        <Link
          href={`/learn/${prev.slug}`}
          className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-cell text-[15px] text-ink-2 hover:text-ink ${focusRing}`}
        >
          <span aria-hidden="true">←</span>
          <Glyph id={glyphForSlug(prev.slug)} size={16} decorative />
          Previous: {prev.title}
        </Link>
      ) : null}
    </footer>
  )
}
