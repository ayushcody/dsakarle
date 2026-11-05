'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { ReactNode, RefObject } from 'react'

import { cn } from '@/components/ui'

import styles from './stage.module.css'
import type { Frame, PredictCandidate } from '@/lib/engine/types'
import { fade } from '@/lib/motion'

import { PredictCard, PredictPrompt } from './PredictPrompt'
import { useStage } from './StageProvider'

export interface NarrationProps {
  /** The stage container, forwarded to the predict prompt for its key handling. */
  scopeRef: RefObject<HTMLElement>
  /** Hero: slightly smaller type. */
  compact?: boolean
  className?: string
}

const sayClass = (compact: boolean) => cn('m-0 text-ink', compact ? 'text-[17px] leading-[1.55]' : 'text-[17px] leading-[1.6] sm:text-[18px]')

/** How many of the longest sentences / questions are kept as invisible height sizers. */
const SAY_SIZERS = 3
const PREDICT_SIZERS = 2

const textLen = (p: PredictCandidate) => p.prompt.length + p.why.length + (p.hint?.length ?? 0) + (p.options?.join(' ').length ?? 0)

/** The longest sentences and predict questions in a run: whichever of them wraps most sets the height. */
function textSizers(frames: Frame[], predictAt: ReadonlySet<number>) {
  const says = Array.from(new Set(frames.map((f) => f.say).filter(Boolean)))
    .sort((a, b) => b.length - a.length)
    .slice(0, SAY_SIZERS)
  const predicts: PredictCandidate[] = []
  predictAt.forEach((i) => {
    const p = frames[i]?.predict
    if (p) predicts.push(p)
  })
  predicts.sort((a, b) => textLen(b) - textLen(a))
  return { says, predicts: predicts.slice(0, PREDICT_SIZERS) }
}

/** Invisible, non-interactive copy laid over the live content so the slot never shrinks below it. */
function Sizer({ children, narrowOnly = false }: { children: ReactNode; narrowOnly?: boolean }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none invisible min-w-0 [grid-area:1/1]', narrowOnly && styles.narrowOnly)}>
      {children}
    </div>
  )
}

/**
 * The sentence for this moment. While a predict question is open it shows the
 * question card instead. The slot is as tall as the run's longest sentence or
 * tallest question card, so stepping (and answering) never moves what is below.
 */
export function Narration({ scopeRef, compact = false, className }: NarrationProps) {
  const index = useStage((s) => s.index)
  const say = useStage((s) => s.frames[s.index]?.say ?? '')
  const promptFrame = useStage((s) => (s.prompt ? s.prompt.frameIndex : -1))
  const frames = useStage((s) => s.frames)
  const predictAt = useStage((s) => s.predictAt)
  const mayAsk = useStage((s) => s.mode === 'guided' && s.predictEnabled)
  const showPrompt = promptFrame >= 0

  const sizers = useMemo(() => textSizers(frames, predictAt), [frames, predictAt])

  return (
    <div className={cn('grid', 'min-h-[3.5rem]', className)}>
      <div className="min-w-0 [grid-area:1/1]">
        <div aria-live="polite" aria-atomic="true">
          {showPrompt ? null : (
            <motion.p key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} className={sayClass(compact)}>
              {say || ' '}
            </motion.p>
          )}
        </div>
        {showPrompt ? (
          <div className={styles.predictLayer}>
            <PredictPrompt key={promptFrame} scopeRef={scopeRef} />
          </div>
        ) : null}
      </div>

      {sizers.says.map((text, i) => (
        <Sizer key={`say-${i}`}>
          <p className={sayClass(compact)}>{text}</p>
        </Sizer>
      ))}
      {mayAsk
        ? sizers.predicts.flatMap((p, i) => [
            <Sizer key={`done-${i}`} narrowOnly>
              <PredictCard predict={p} status="revealed" />
            </Sizer>,
            <Sizer key={`hint-${i}`} narrowOnly>
              <PredictCard predict={p} status="hint" wrong={p.options?.[0]} />
            </Sizer>,
          ])
        : null}
    </div>
  )
}
