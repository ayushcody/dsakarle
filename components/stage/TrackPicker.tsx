'use client'

import { useId } from 'react'

import { SegmentedControl, cn } from '@/components/ui'
import type { StageTrack } from '@/types/learning'

export interface TrackPickerProps {
  tracks: StageTrack[]
  value: string
  onChange: (id: string) => void
  className?: string
}

/** Up to this many tracks fit a segmented control; more become a dropdown so labels never wrap. */
const SEGMENTED_MAX = 3

/** Switch between a lesson's tracks (e.g. Access / Insert / Delete). Hidden when there is only one. */
export function TrackPicker({ tracks, value, onChange, className }: TrackPickerProps) {
  const id = useId()
  if (tracks.length <= 1) return null

  if (tracks.length > SEGMENTED_MAX) {
    return (
      <div className={cn('flex min-w-0 items-center gap-2', className)}>
        <label htmlFor={id} className="shrink-0 text-[14px] font-semibold text-ink-2">
          Example
        </label>
        <span className="relative min-w-0">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'h-10 max-w-full cursor-pointer appearance-none truncate rounded-control border border-rule bg-paper-raised py-0 pl-3 pr-9 text-[15px] font-medium text-ink hover:border-rule-strong',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
            )}
          >
            {tracks.map((t, i) => (
              <option key={t.id} value={t.id}>
                {i + 1}. {t.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-ink-3">
          {tracks.findIndex((t) => t.id === value) + 1} of {tracks.length}
        </span>
      </div>
    )
  }

  return (
    <SegmentedControl
      className={className}
      aria-label="Choose an example"
      value={value}
      onChange={onChange}
      options={tracks.map((t) => ({ value: t.id, label: t.label }))}
    />
  )
}
