'use client'

import { motion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import type { RefObject } from 'react'

import { Button, Chip, Kbd, cn, focusRing } from '@/components/ui'
import type { PromptStatus } from '@/lib/engine/store'
import type { PredictCandidate } from '@/lib/engine/types'
import { fade, spring } from '@/lib/motion'

import { useStage, useStageApi } from './StageProvider'

/** An ink stamp that thumps down: ring, then the tick draws itself. */
function Stamp({ tone }: { tone: 'found' | 'note' }) {
  const color = tone === 'found' ? 'var(--role-found)' : 'var(--ink-3)'
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="h-9 w-9 shrink-0"
      initial={{ scale: 1.7, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -6, opacity: 1 }}
      transition={spring}
      fill="none"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="13" strokeDasharray="3 2.2" opacity="0.55" />
      <circle cx="16" cy="16" r="10.5" />
      {tone === 'found' ? (
        <motion.path
          d="M10.5 16.5l4 4 7-8.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        />
      ) : (
        <motion.path
          d="M16 10.5v7M16 21.5v.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        />
      )}
    </motion.svg>
  )
}

export interface PredictCardProps {
  predict: PredictCandidate
  status: PromptStatus
  /** The learner's last (wrong) answer, shown struck out on the chip. */
  wrong?: string | number
  onAnswer?: (choice: string) => void
  onSkip?: () => void
  onContinue?: () => void
  /** Set by the live card so it can move focus to the card, and to Continue once answered. */
  cardRef?: RefObject<HTMLDivElement>
  continueRef?: RefObject<HTMLButtonElement>
  className?: string
}

/** The card itself: pure view of one prompt in one state. Also drawn invisibly to reserve the tallest state's height. */
export function PredictCard({
  predict,
  status,
  wrong,
  onAnswer,
  onSkip,
  onContinue,
  cardRef,
  continueRef,
  className,
}: PredictCardProps) {
  const questionId = useId()
  const isOpen = status === 'asking' || status === 'hint'
  const isDone = status === 'correct' || status === 'revealed'
  const { options, kind } = predict
  const answerText = String(predict.answer)

  return (
    <motion.div
      ref={cardRef}
      role="group"
      aria-labelledby={questionId}
      tabIndex={-1}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className={cn(
        'flex flex-col gap-3 rounded-card border border-rule border-l-[3px] border-l-coral bg-paper-raised p-4 shadow-1 outline-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="t-eyebrow !text-coral-ink">Your turn: predict</p>
        {isOpen ? (
          <Button variant="link" onClick={() => onSkip?.()} className="!min-h-[32px] text-[14px]">
            Skip this one
          </Button>
        ) : null}
      </div>

      <p id={questionId} className={cn('font-serif text-[20px] leading-7 sm:text-[22px]', isDone ? 'text-ink-2' : 'text-ink')}>
        {predict.prompt}
      </p>

      {isOpen && kind === 'choice' && options ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose one">
          {options.map((opt, i) => {
            const bad = wrong !== undefined && String(wrong) === opt
            return (
              <Chip
                key={opt}
                selectable
                selected={false}
                variant={bad ? 'error' : 'neutral'}
                disabled={bad}
                onClick={() => onAnswer?.(opt)}
                className={cn('min-h-[44px] text-[15px]', focusRing)}
                aria-keyshortcuts={String(i + 1)}
              >
                <Kbd className="hidden lg:inline-flex">{i + 1}</Kbd>
                <span>{opt}</span>
                {bad ? <span aria-hidden="true">✕</span> : null}
              </Chip>
            )
          })}
        </div>
      ) : null}

      {isOpen && kind === 'cell' ? (
        <p className="flex items-center gap-2 text-[15px] text-ink-2">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-coral" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2l8 5.5-3.6.9L10.5 14l-2 .8-2.1-5.4L4 11.5z" />
          </svg>
          Tap the spot in the picture you think it is.
        </p>
      ) : null}

      <div aria-live="polite" role="status">
        {status === 'hint' ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} className="text-[15px] leading-6 text-ink-2">
            <span className="font-semibold text-[var(--role-compare)]">Not quite. </span>
            {predict.hint ? <>{predict.hint} </> : null}
            <span className="font-semibold text-ink">Try once more.</span>
          </motion.p>
        ) : null}

        {isDone ? (
          <div className="flex items-start gap-3">
            <Stamp tone={status === 'correct' ? 'found' : 'note'} />
            <p className="min-w-0 pt-1 text-[16px] leading-6 text-ink">
              {status === 'correct' ? (
                <>
                  <span className="font-semibold text-found-ink">Nice — </span>
                  {predict.why}
                </>
              ) : (
                <>
                  <span className="font-semibold">{kind === 'cell' ? 'It goes here: ' : `It's “${answerText}”: `}</span>
                  {predict.why}
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>

      {isDone ? (
        <div className="flex items-center gap-3">
          <Button
            ref={continueRef as RefObject<HTMLButtonElement | HTMLAnchorElement> | undefined}
            onClick={() => onContinue?.()}
            trailingIcon={
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
            }
          >
            Continue
          </Button>
          <span className="hidden items-center gap-1.5 text-[13px] text-ink-3 lg:inline-flex" aria-hidden="true">
            or press <Kbd>Enter</Kbd>
          </span>
        </div>
      ) : null}
    </motion.div>
  )
}

export interface PredictPromptProps {
  /** The stage container: number keys 1-9 and Enter are listened for inside it. */
  scopeRef: RefObject<HTMLElement>
  className?: string
}

/**
 * The predict-then-reveal card. Replaces the narration while a question is open.
 * asking -> hint (one retry) -> correct | revealed -> Continue.
 */
export function PredictPrompt({ scopeRef, className }: PredictPromptProps) {
  const api = useStageApi()
  const prompt = useStage((s) => s.prompt)
  const predict = useStage((s) => (s.prompt ? s.frames[s.prompt.frameIndex]?.predict : undefined))
  const rootRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)

  const status = prompt?.status
  const isOpen = status === 'asking' || status === 'hint'
  const isDone = status === 'correct' || status === 'revealed'

  // Move focus to the card when it appears, and to Continue once it is answered.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    if (isDone) continueRef.current?.focus({ preventScroll: true })
  }, [isDone])

  const options = predict?.options
  const kind = predict?.kind

  const proceed = () => {
    api.continueAfterPrompt()
    scopeRef.current?.focus({ preventScroll: true })
  }

  // 1 / 2 / 3 choose an option; Enter continues after the answer.
  const stateRef = useRef({ isOpen, isDone, kind, options })
  stateRef.current = { isOpen, isDone, kind, options }
  useEffect(() => {
    const el = scopeRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const s = stateRef.current
      if (s.isOpen && s.kind === 'choice' && s.options && /^[1-9]$/.test(e.key)) {
        const opt = s.options[Number(e.key) - 1]
        if (opt !== undefined) {
          api.answer(opt)
          e.preventDefault()
        }
      } else if (s.isDone && e.key === 'Enter' && !(t && t.closest('button, a, summary'))) {
        api.continueAfterPrompt()
        el.focus({ preventScroll: true })
        e.preventDefault()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [scopeRef, api])

  if (!prompt || !predict || !status) return null

  return (
    <PredictCard
      predict={predict}
      status={status}
      wrong={status === 'hint' ? prompt.chosen : undefined}
      onAnswer={(opt) => api.answer(opt)}
      onSkip={() => api.skipPrompt()}
      onContinue={proceed}
      cardRef={rootRef}
      continueRef={continueRef}
      className={className}
    />
  )
}
