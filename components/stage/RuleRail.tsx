'use client'

import { useId } from 'react'

import { cn } from '@/components/ui'
import type { AnchorId } from '@/lib/engine/types'

import { useStage } from './StageProvider'

export interface RuleRailProps {
  /** tracer.anchors: anchor id -> plain-English rule, in rail order. */
  anchors: Record<AnchorId, string>
  className?: string
}

/**
 * The algorithm as numbered rules. The rule behind the current frame is
 * marked with a coral rule, which is how "code shown last" still connects each
 * step to the logic.
 */
export function RuleRail({ anchors, className }: RuleRailProps) {
  const at = useStage((s) => s.frames[s.index]?.at)
  const uid = useId()
  const entries = Object.entries(anchors)
  if (entries.length === 0) return null

  return (
    <section aria-labelledby={`${uid}-h`} className={className}>
      <h3 id={`${uid}-h`} className="t-eyebrow mb-2">
        The rules
      </h3>
      <ol className="m-0 flex list-none flex-col p-0">
        {entries.map(([id, text], i) => {
          const active = id === at
          return (
            <li
              key={id}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex items-baseline gap-2.5 border-l-2 py-1 pl-3 text-[14px] leading-[22px] transition-colors duration-150',
                active ? 'border-l-coral-ink text-ink' : 'border-l-rule text-ink-3',
              )}
            >
              <span aria-hidden="true" className="w-4 shrink-0 font-mono text-[12px] tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">{active ? 'Current rule: ' : `Rule ${i + 1}: `}</span>
                {text}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
