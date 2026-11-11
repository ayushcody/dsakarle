'use client'

import { Button, Kbd, SegmentedControl, cn, focusRing } from '@/components/ui'
import type { Speed } from '@/lib/engine/store'

import styles from './code.module.css'
import { useStage, useStageApi, useStageStore } from './StageProvider'

const SPEEDS: Speed[] = [0.5, 1, 2]

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

export interface ControlsProps {
  /** Hero: fewer controls (no speed, no key hints). */
  compact?: boolean
  className?: string
}

/** Prev / Play / Next, a labelled scrubber, speed, reset. Never blocked by a predict prompt except Next and Play. */
export function Controls({ compact = false, className }: ControlsProps) {
  const api = useStageApi()
  const store = useStageStore()
  const index = useStage((s) => s.index)
  const n = useStage((s) => s.frames.length)
  const playing = useStage((s) => s.playing)
  const speed = useStage((s) => s.speed)
  const asking = useStage((s) => s.prompt !== null && (s.prompt.status === 'asking' || s.prompt.status === 'hint'))

  const last = n - 1
  const atEnd = n > 0 && index >= last
  const empty = n === 0

  const reset = () => {
    const s = store.getState()
    const keep = s.speed
    s.load(s.frames, { mode: s.mode, predictAt: s.predictAt, predictEnabled: s.predictEnabled })
    store.getState().setSpeed(keep)
  }

  const blocked = asking ? 'Answer the question first, or skip it' : undefined
  const playLabel = playing ? 'Pause' : atEnd ? 'Replay' : 'Play'

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <div className="order-1 flex w-full shrink-0 items-center gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
        <Button
          variant="secondary"
          onClick={() => api.prev()}
          disabled={empty || index === 0}
          leadingIcon={<Icon d="M10 3L5 8l5 5" />}
          aria-keyshortcuts="ArrowLeft"
        >
          Prev
        </Button>
        <Button
          variant="primary"
          onClick={() => api.toggle()}
          disabled={empty || asking}
          title={blocked}
          leadingIcon={
            playing ? <Icon d="M5 3v10M11 3v10" /> : atEnd ? <Icon d="M3 8a5 5 0 1 0 1.8-3.8M3 2.5v3h3" /> : <Icon d="M5 3l8 5-8 5z" fill />
          }
          className="min-w-[6.5rem]"
          aria-keyshortcuts="Space"
        >
          {playLabel}
        </Button>
        <Button
          variant="secondary"
          onClick={() => api.next()}
          disabled={empty || atEnd || asking}
          title={blocked}
          trailingIcon={<Icon d="M6 3l5 5-5 5" />}
          aria-keyshortcuts="ArrowRight"
        >
          Next
        </Button>
      </div>

      <div className="order-2 flex min-w-0 basis-full items-center gap-3 sm:basis-0 sm:flex-1 sm:min-w-[9rem]">
        <input
          type="range"
          min={0}
          max={Math.max(0, last)}
          step={1}
          value={Math.min(index, Math.max(0, last))}
          disabled={empty}
          onChange={(e) => api.seek(Number(e.target.value))}
          aria-label={`Step ${index + 1} of ${n}`}
          aria-valuetext={`Step ${index + 1} of ${n}`}
          className={cn(styles.range, 'h-10 min-w-0 flex-1 cursor-pointer rounded-pill', focusRing)}
        />
        <span className="shrink-0 whitespace-nowrap text-[14px] tabular-nums text-ink-3" aria-hidden="true">
          {empty ? '—' : `Step ${index + 1} of ${n}`}
        </span>
      </div>

      <div className="order-3 flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
        {compact ? null : (
          <SegmentedControl
            aria-label="Speed"
            value={String(speed)}
            onChange={(v) => api.setSpeed(Number(v) as Speed)}
            options={SPEEDS.map((sp) => ({ value: String(sp), label: `${sp}×` }))}
          />
        )}
        <Button variant="secondary" onClick={reset} disabled={empty || (index === 0 && !playing)}>
          Reset
        </Button>
      </div>

      {compact ? null : (
        <p className="order-4 hidden basis-full items-center justify-end gap-4 text-[13px] text-ink-3 lg:flex" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> step
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Space</Kbd> play
          </span>
        </p>
      )}
    </div>
  )
}
