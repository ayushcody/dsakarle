import type { ReactNode } from 'react'

import { cn } from '@/components/ui/cn'

interface SectionFrameProps {
  id: string
  /** e.g. "4 · Watch". Matches the right-rail outline. */
  eyebrow: string
  /** Section heading (the page's only h1 is the lesson title). */
  title: ReactNode
  /** One calm line under the heading. */
  intro?: ReactNode
  /** `prose` caps the section at the reading measure; `wide` lets it use the whole column (the Stage). */
  width?: 'prose' | 'wide'
  /** Render the heading visually but keep `title` as a styled question instead of the default h2 look. */
  titleClassName?: string
  className?: string
  children: ReactNode
}

/** Shared section chrome: anchor id, eyebrow, t-h2 title, optional intro. */
export function SectionFrame({
  id,
  eyebrow,
  title,
  intro,
  width = 'prose',
  titleClassName,
  className,
  children,
}: SectionFrameProps) {
  const headingId = `${id}-heading`
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-32', className)}>
      <header className="mb-6 max-w-[760px]">
        <p className="t-eyebrow mb-2">{eyebrow}</p>
        <h2 id={headingId} className={cn('t-h2 text-balance text-ink', titleClassName)}>
          {title}
        </h2>
        {intro ? <p className="mt-2 max-w-[68ch] text-[17px] leading-7 text-ink-2">{intro}</p> : null}
      </header>
      <div className={cn(width === 'prose' && 'max-w-[760px]')}>{children}</div>
    </section>
  )
}
