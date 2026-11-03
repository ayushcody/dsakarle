'use client'

import { SegmentedControl } from '@/components/ui'
import type { StageTrack } from '@/types/learning'

export interface TrackPickerProps {
  tracks: StageTrack[]
  value: string
  onChange: (id: string) => void
  className?: string
}

/** Switch between a lesson's tracks (e.g. Access / Insert / Delete). Hidden when there is only one. */
export function TrackPicker({ tracks, value, onChange, className }: TrackPickerProps) {
  if (tracks.length <= 1) return null
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
