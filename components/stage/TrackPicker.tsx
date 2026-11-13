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
/** Segments share the width equally, so the longest label decides whether they fit. Past this
 * (longest label length × number of tracks) a phone-width control wraps labels onto 3+ lines. */
const PHONE_BUDGET = 60
/** Past this many label characters in total, even a desktop-width control wraps. */
const DESKTOP_BUDGET = 60

function TrackSelect({ tracks, value, onChange, className }: TrackPickerProps) {
  const id = useId()
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <label htmlFor={id} className="shrink-0 text-[14px] font-semibold text-ink-2">
        Example
      </label>
      <span className="relative min-w-0 flex-initial">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 w-full cursor-pointer appearance-none truncate rounded-control border border-rule bg-paper-raised py-0 pl-3 pr-9 text-[15px] font-medium text-ink hover:border-rule-strong',
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

/** Switch between a lesson's tracks (e.g. Access / Insert / Delete). Hidden when there is only one. */
export function TrackPicker(props: TrackPickerProps) {
  const { tracks, value, onChange, className } = props
  if (tracks.length <= 1) return null

  const longest = Math.max(...tracks.map((t) => t.label.length))
  const total = tracks.reduce((n, t) => n + t.label.length, 0)

  if (tracks.length > SEGMENTED_MAX || total > DESKTOP_BUDGET) return <TrackSelect {...props} />

  const segmented = (
    <SegmentedControl
      aria-label="Choose an example"
      value={value}
      onChange={onChange}
      options={tracks.map((t) => ({ value: t.id, label: t.label }))}
    />
  )

  if (longest * tracks.length <= PHONE_BUDGET) return <div className={className}>{segmented}</div>

  // Long labels: a dropdown on phones, the segmented control from `sm` up.
  return (
    <div className={className}>
      <TrackSelect {...props} className="sm:hidden" />
      <div className="hidden sm:block">{segmented}</div>
    </div>
  )
}
