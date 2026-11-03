'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'

import { Callout, Chip, SegmentedControl, cn } from '@/components/ui'
import { selectPredicts } from '@/lib/engine/select-predicts'
import type { StageMode } from '@/lib/engine/store'
import type { AnyTracer, Frame } from '@/lib/engine/types'
import { loadTracer } from '@/lib/tracers'

import type { StageProps } from './contracts'
import { PlaygroundInput } from './PlaygroundInput'
import { StageProvider, useStage, useStageApi } from './StageProvider'
import { StageView } from './StageView'
import { TrackPicker } from './TrackPicker'

const NO_PREDICTS: number[] = []

function safeRun(tracer: AnyTracer, input: unknown): Frame[] | null {
  try {
    return tracer.run(input).frames
  } catch {
    return null
  }
}

/** Track picker, mode switch and the predict toggle. Lives inside the provider so it can read the store. */
function StageHeader({
  tracks,
  trackId,
  onTrack,
  mode,
  onMode,
  showModes,
  showPredict,
  predictPref,
}: {
  tracks: StageProps['tracks']
  trackId: string
  onTrack: (id: string) => void
  mode: StageMode
  onMode: (m: StageMode) => void
  showModes: boolean
  /** Guided mode with questions to ask. */
  showPredict: boolean
  predictPref: MutableRefObject<boolean>
}) {
  const api = useStageApi()
  const predictOn = useStage((s) => s.predictEnabled)

  // A fresh store starts with predictions on; restore the learner's choice.
  useEffect(() => {
    if (mode === 'guided') api.setPredictEnabled(predictPref.current)
  }, [api, mode, predictPref])

  const multi = tracks.length > 1
  const predict = showPredict && mode === 'guided'
  if (!multi && !showModes && !predict) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <TrackPicker tracks={tracks} value={trackId} onChange={onTrack} />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {showModes ? (
          <SegmentedControl
            aria-label="Mode"
            value={mode}
            onChange={onMode}
            options={[
              { value: 'guided', label: 'Watch it run' },
              { value: 'playground', label: 'Try your own' },
            ]}
          />
        ) : null}
        {predict ? (
          <Chip
            selectable
            selected={predictOn}
            onClick={() => {
              predictPref.current = !predictOn
              api.setPredictEnabled(!predictOn)
            }}
            title="Pause before key moments and guess what happens next"
          >
            Predict: {predictOn ? 'on' : 'off'}
          </Chip>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The interactive walkthrough: watch a real run frame by frame, predict the next
 * move, then try your own input. One store per Stage.
 */
export function Stage({ tracks, playground, variant = 'lesson', code, onGuidedFinish, className }: StageProps) {
  const hero = variant === 'hero'
  const usable = useMemo(() => (hero ? tracks.slice(0, 1) : tracks), [hero, tracks])

  const [trackId, setTrackId] = useState(usable[0]?.id ?? '')
  const [requestedMode, setMode] = useState<StageMode>('guided')
  const [tracers, setTracers] = useState<Record<string, AnyTracer>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [custom, setCustom] = useState<{ trackId: string; frames: Frame[] } | null>(null)
  /** True right after the learner pressed Run: the new run plays itself. */
  const [fresh, setFresh] = useState(false)
  const predictPref = useRef(true)
  const lastRaw = useRef<Record<string, Record<string, string>>>({})

  const track = usable.find((t) => t.id === trackId) ?? usable[0]
  const canPlay = playground && !hero
  const mode: StageMode = canPlay ? requestedMode : 'guided'

  // Load every track's tracer up front so switching tracks is instant.
  const tracerKey = usable.map((t) => t.tracer).join('|')
  useEffect(() => {
    let cancelled = false
    const ids = Array.from(new Set(usable.map((t) => t.tracer)))
    Promise.all(ids.map((id) => loadTracer(id).then((t) => [id, t] as const)))
      .then((pairs) => {
        if (!cancelled) setTracers(Object.fromEntries(pairs))
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load the demo.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracerKey])

  const tracer = track ? tracers[track.tracer] : undefined
  const presetCount = tracer?.input.presets.length ?? 0
  const presetIndex = track ? Math.min(Math.max(0, track.preset ?? 0), Math.max(0, presetCount - 1)) : 0

  const presetFrames = useMemo(() => {
    const preset = tracer?.input.presets[presetIndex]
    return tracer && preset ? safeRun(tracer, preset.value) : null
  }, [tracer, presetIndex])

  const predictAt = useMemo(
    () => (presetFrames && track?.predict ? selectPredicts(presetFrames, track.predict) : NO_PREDICTS),
    [presetFrames, track?.predict],
  )

  const handleRun = useCallback(
    (input: unknown, raw: Record<string, string>): string | null => {
      if (!tracer || !track) return 'The demo is still loading. Try again in a moment.'
      const frames = safeRun(tracer, input)
      if (!frames || frames.length === 0) return 'That input could not be run. Try a smaller one.'
      lastRaw.current[track.id] = raw
      setCustom({ trackId: track.id, frames })
      setFresh(true)
      return null
    },
    [tracer, track],
  )

  const reportedRef = useRef(false)
  const handleFinish = useCallback(() => {
    if (reportedRef.current) return
    reportedRef.current = true
    onGuidedFinish?.()
  }, [onGuidedFinish])

  const changeTrack = (id: string) => {
    setTrackId(id)
    setCustom(null)
    setFresh(false)
  }

  const changeMode = (m: StageMode) => {
    setMode(m)
    setFresh(false)
  }

  if (!track) return null

  if (loadError) {
    return (
      <Callout variant="warning" title="Couldn't load the demo" className={className}>
        {loadError}
      </Callout>
    )
  }

  if (!tracer || !presetFrames) {
    return (
      <div
        role="status"
        aria-busy="true"
        className={cn('graph-paper flex items-center justify-center rounded-card border border-rule p-6 shadow-1', hero ? 'min-h-[18rem]' : 'min-h-[30rem]', className)}
      >
        <p className="font-serif text-[18px] text-ink-3">{tracer ? 'That example could not be run.' : 'Getting the demo ready…'}</p>
      </div>
    )
  }

  const mineHere = custom && custom.trackId === track.id ? custom : null
  const frames = mode === 'playground' && mineHere ? mineHere.frames : presetFrames
  // New runs inside a mode reload the store (StageProvider reacts to new frames) so the form keeps its state.
  const providerKey = `${track.id}:${mode}`

  return (
    <StageProvider
      key={providerKey}
      frames={frames}
      mode={mode}
      predictAt={mode === 'guided' ? predictAt : NO_PREDICTS}
      autoPlay={mode === 'playground' && fresh}
    >
      <StageView
        tracer={tracer}
        variant={variant}
        className={className}
        code={code?.[track.tracer]}
        canTryOwn={canPlay}
        onTryOwn={() => changeMode('playground')}
        onFinish={handleFinish}
        header={
          <StageHeader
            tracks={usable}
            trackId={track.id}
            onTrack={changeTrack}
            mode={mode}
            onMode={changeMode}
            showModes={canPlay}
            showPredict={!hero && predictAt.length > 0}
            predictPref={predictPref}
          />
        }
        playgroundSlot={
          mode === 'playground' ? (
            <PlaygroundInput
              key={track.id}
              tracer={tracer}
              presetIndex={presetIndex}
              initialValues={lastRaw.current[track.id]}
              onRun={handleRun}
            />
          ) : null
        }
      />
    </StageProvider>
  )
}
