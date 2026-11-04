'use client'

import { motion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'

import { cn } from '@/components/ui'
import type { AnchorId } from '@/lib/engine/types'
import { spring } from '@/lib/motion'

import { ScrollRegion } from './primitives/ScrollRegion'

import { useStage } from './StageProvider'

export interface RuleRailProps {
  /** tracer.anchors: anchor id -> plain-English rule, in rail order. */
  anchors: Record<AnchorId, string>
  className?: string
}

/**
 * The algorithm as numbered rules. The rule behind the current frame is
 * highlighted, which is how "code shown last" still connects each step to the
 * logic. A vertical list on desktop, a scrolling row of chips on small screens.
 */
export function RuleRail({ anchors, className }: RuleRailProps) {
  const at = useStage((s) => s.frames[s.index]?.at)
  const uid = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const entries = Object.entries(anchors)

  // On the horizontal layout keep the active chip in view without scrolling the page.
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const el = list.querySelector<HTMLElement>('[aria-current="step"]')
    if (!el) return
    const target = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2
    list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [at])

  if (entries.length === 0) return null

  return (
    <section aria-labelledby={`${uid}-h`} className={className}>
      <h3 id={`${uid}-h`} className="t-eyebrow mb-2">
        The rules
      </h3>
      <ScrollRegion
        ref={listRef}
        label="Rules"
        className="-mx-1 rounded-cell px-1 pb-1 lg:mx-0 lg:overflow-visible lg:p-0"
      >
      <ol className="m-0 flex list-none gap-2 p-0 lg:flex-col lg:gap-1">
        {entries.map(([id, text], i) => {
          const active = id === at
          return (
            <li
              key={id}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'relative flex shrink-0 items-start gap-2.5 rounded-cell py-2 pl-3 pr-3 text-[15px] leading-[22px] transition-colors duration-150',
                'border border-rule lg:border-transparent',
                active ? 'text-ink' : 'text-ink-2',
              )}
            >
              {active ? (
                <motion.span
                  layoutId={`${uid}-active`}
                  transition={spring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-cell border-l-[3px] border-l-coral bg-coral-wash"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  'relative mt-px inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-pill font-mono text-[12px] font-semibold',
                  active ? 'bg-coral-ink text-paper' : 'bg-paper-sunken text-ink-2',
                )}
              >
                {i + 1}
              </span>
              {/* Same weight active or not: a bolder active rule would wrap differently and move the column. */}
              <span className="relative whitespace-nowrap lg:whitespace-normal">
                <span className="sr-only">{active ? 'Current rule: ' : `Rule ${i + 1}: `}</span>
                {text}
              </span>
            </li>
          )
        })}
      </ol>
      </ScrollRegion>
    </section>
  )
}
