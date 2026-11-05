import type { ReactNode } from 'react'

import { cn } from '@/components/ui/cn'

import { sectionLabel } from './sections'

interface SectionFrameProps {
  id: string
  /** Heading text. Defaults to the section's label. */
  title?: string
  /** One calm line under the heading. */
  intro?: ReactNode
  /** `prose` is the ~720px reading column; `wide` lets the body (the Stage) use up to ~980px. */
  width?: 'prose' | 'wide'
  className?: string
  children: ReactNode
}

/** Shared section chrome: anchor id, an anchored h2 (a `#` appears on hover), optional intro. */
export function SectionFrame({ id, title, intro, width = 'prose', className, children }: SectionFrameProps) {
  const headingId = `${id}-heading`
  const text = title ?? sectionLabel(id)
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-24', className)}>
      <header className="mx-auto mb-5 max-w-[720px]">
        <h2 id={headingId} className="anchor-heading t-h2 text-balance text-ink">
          <a
            href={`#${id}`}
            className="rounded-cell text-ink no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            {text}
          </a>
        </h2>
        {intro ? <p className="mt-2 text-[16px] leading-7 text-ink-2">{intro}</p> : null}
      </header>
      <div className={cn('mx-auto', width === 'prose' ? 'max-w-[720px]' : 'max-w-[980px]')}>{children}</div>
    </section>
  )
}
