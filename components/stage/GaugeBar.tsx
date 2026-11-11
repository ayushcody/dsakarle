'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

import { cn } from '@/components/ui'
import type { Gauge } from '@/lib/engine/types'
import { spring } from '@/lib/motion'

import { useStage } from './StageProvider'

const MAX_SLOTS = 16

/**
 * frame.gauge as a labelled bar, e.g. "Window size 3 / 3". Segmented when the
 * limit is small enough to count; turns error-coloured with a cross when the
 * value goes past the limit. Renders nothing for frames without a gauge.
 */
export function GaugeBar({ className }: { className?: string }) {
  const gauge = useStage((s) => s.frames[s.index]?.gauge)
  const frames = useStage((s) => s.frames)
  // A run that uses a gauge keeps its space on frames without one, so the rest of the column does not jump.
  const sample = useMemo(() => {
    const first = frames.find((f) => f.gauge)?.gauge
    return first ? { gauge: first, over: frames.some((f) => f.gauge && f.gauge.value > f.gauge.max) } : null
  }, [frames])
  if (!sample) return null

  return (
    <div className={cn('grid', className)}>
      <div className="min-w-0 [grid-area:1/1]">{gauge ? <GaugeView gauge={gauge} /> : null}</div>
      <div aria-hidden="true" className="pointer-events-none invisible min-w-0 [grid-area:1/1]">
        <GaugeView gauge={sample.over ? { ...sample.gauge, value: sample.gauge.max + 1 } : sample.gauge} />
      </div>
    </div>
  )
}

function GaugeView({ gauge, className }: { gauge: Gauge; className?: string }) {
  const { value, max, label } = gauge
  const over = value > max
  const segmented = max > 0 && max <= MAX_SLOTS
  const extra = over ? Math.min(Math.ceil(value - max), 3) : 0
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0
  const text = over ? `${label}: ${value} is more than the limit of ${max}` : `${label}: ${value} of ${max}`

  return (
    <section className={className} aria-label={label}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h3 className="t-eyebrow">{label}</h3>
        <p
          className={cn('font-mono text-[14px] font-medium', over ? 'text-role-error' : 'text-ink')}
          role="img"
          aria-label={text}
        >
          {over ? <span aria-hidden="true">✕ </span> : null}
          <span aria-hidden="true">
            {value} / {max}
          </span>
        </p>
      </div>

      {segmented ? (
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 flex-1 rounded-[3px] border transition-colors duration-150',
                i < Math.min(value, max)
                  ? over
                    ? 'border-role-error bg-[var(--role-error-wash)]'
                    : 'border-coral bg-coral'
                  : 'border-rule bg-paper-sunken',
              )}
            />
          ))}
          {Array.from({ length: extra }, (_, i) => (
            <span key={`x${i}`} className="h-2 w-2 shrink-0 rounded-[3px] border border-dashed border-role-error bg-[var(--role-error-wash)]" />
          ))}
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-pill border border-rule bg-paper-sunken" aria-hidden="true">
          <motion.div
            className={cn('h-full', over ? 'bg-role-error' : 'bg-coral')}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={spring}
          />
        </div>
      )}

      {over ? (
        <p className="mt-1.5 text-[13px] leading-[18px] text-role-error">
          <span aria-hidden="true">✕ </span>Over the limit, so something has to go.
        </p>
      ) : null}
    </section>
  )
}
