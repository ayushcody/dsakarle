'use client'

import { motion } from 'framer-motion'

import { cn } from '@/components/ui'
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
  if (!gauge) return null

  const { value, max, label } = gauge
  const over = value > max
  const segmented = max > 0 && max <= MAX_SLOTS
  const extra = over ? Math.min(Math.ceil(value - max), 3) : 0
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0
  const text = over ? `${label}: ${value} is more than the limit of ${max}` : `${label}: ${value} of ${max}`

  return (
    <section className={className} aria-label={label}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="t-eyebrow">{label}</h3>
        <p
          className={cn('font-mono text-[15px] font-semibold', over ? 'text-role-error' : 'text-ink')}
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
                'h-3 flex-1 rounded-[3px] border transition-colors duration-150',
                i < Math.min(value, max)
                  ? over
                    ? 'border-role-error bg-[var(--role-error-wash)]'
                    : 'border-coral bg-coral'
                  : 'border-rule bg-paper-sunken',
              )}
            />
          ))}
          {Array.from({ length: extra }, (_, i) => (
            <span key={`x${i}`} className="h-3 w-3 shrink-0 rounded-[3px] border border-dashed border-role-error bg-[var(--role-error-wash)]" />
          ))}
        </div>
      ) : (
        <div className="h-3 overflow-hidden rounded-pill border border-rule bg-paper-sunken" aria-hidden="true">
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
