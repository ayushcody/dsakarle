'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Glyph, glyphForSlug } from '@/components/glyph'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { cn } from '@/components/ui/cn'
import { getLessonMeta } from '@/lib/curriculum'
import { saveQuizScore } from '@/lib/progress'
import type { LessonV2, RecognitionItem } from '@/types/learning'

import { SectionFrame } from './SectionFrame'
import { seededShuffle } from './utils'

function ClueList({ title, items, tone }: { title: string; items: string[]; tone: 'yes' | 'no' }) {
  return (
    <div className="rounded-card border border-rule bg-paper-raised p-5 shadow-1">
      <h3 className="t-h3 mb-3 text-ink">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 text-[16px] leading-6 text-ink-2">
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none',
                tone === 'yes' ? 'bg-[var(--role-found-wash)] text-role-found' : 'bg-[var(--role-error-wash)] text-role-error',
              )}
            >
              {tone === 'yes' ? '✓' : '✕'}
            </span>
            <span>
              <span className="sr-only">{tone === 'yes' ? 'Yes: ' : 'No: '}</span>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ItemState {
  wrong: string[]
  /** Slug the learner settled on correctly (or was shown). */
  resolved: boolean
  firstTry: boolean | null
}

function RecognitionCard({
  item,
  index,
  total,
  slug,
  state,
  onPick,
  onShow,
}: {
  item: RecognitionItem
  index: number
  total: number
  slug: string
  state: ItemState
  onPick: (option: string) => void
  onShow: () => void
}) {
  const options = useMemo(() => seededShuffle(item.options, `${slug}:recognise:${index}`), [item.options, slug, index])
  const answerMeta = getLessonMeta(item.answer)
  const lastWrong = state.wrong[state.wrong.length - 1]
  const lastWrongMeta = lastWrong ? getLessonMeta(lastWrong) : undefined

  return (
    <li className="rounded-card border border-rule bg-paper-raised p-5 shadow-1 sm:p-6">
      <p className="t-eyebrow mb-2">
        Which pattern? {index + 1} of {total}
      </p>
      <p className="font-serif text-[19px] leading-7 text-ink">{item.problem}</p>

      <div role="group" aria-label="Choose a pattern" className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const meta = getLessonMeta(option)
          const title = meta?.title ?? option
          const isAnswer = option === item.answer
          const isWrong = state.wrong.includes(option)
          const showCorrect = state.resolved && isAnswer
          const variant = showCorrect ? 'found' : isWrong ? 'error' : 'neutral'
          return (
            <Chip
              key={option}
              selectable
              variant={variant}
              icon={<Glyph id={glyphForSlug(option)} size={20} decorative />}
              aria-disabled={state.resolved || isWrong || undefined}
              onClick={() => {
                if (!state.resolved && !isWrong) onPick(option)
              }}
              className={cn(
                'min-h-[44px]',
                showCorrect && 'border-role-found font-semibold',
                isWrong && 'border-role-error line-through decoration-2',
                (state.resolved && !isAnswer) || isWrong ? 'cursor-default' : '',
              )}
            >
              {showCorrect ? <span aria-hidden="true">✓</span> : null}
              {isWrong ? <span aria-hidden="true">✕</span> : null}
              {title}
              {showCorrect ? <span className="sr-only"> (correct)</span> : null}
              {isWrong ? <span className="sr-only"> (not this one)</span> : null}
            </Chip>
          )
        })}
      </div>

      <div aria-live="polite" className="mt-4 empty:mt-0">
        {state.resolved ? (
          <div className="rounded-r-card border-l-[3px] border-l-role-found bg-[var(--role-found-wash)] px-4 py-3">
            <p className="text-[15px] font-semibold text-role-found">
              <span aria-hidden="true">✓ </span>
              {answerMeta?.title ?? item.answer}
              {state.firstTry ? ' — spotted it first try' : ''}
            </p>
            <p className="mt-1 text-[15px] leading-6 text-ink-2">{item.explanation}</p>
          </div>
        ) : lastWrong ? (
          <div className="rounded-r-card border-l-[3px] border-l-role-error bg-[var(--role-error-wash)] px-4 py-3">
            <p className="text-[15px] font-semibold text-role-error">
              <span aria-hidden="true">✕ </span>Not quite.
            </p>
            {lastWrongMeta ? (
              <p className="mt-1 text-[15px] leading-6 text-ink-2">
                {lastWrongMeta.title} is for: {lastWrongMeta.trigger.charAt(0).toLowerCase() + lastWrongMeta.trigger.slice(1)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {!state.resolved && state.wrong.length >= 2 ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onShow}>
          Show me the answer
        </Button>
      ) : null}
    </li>
  )
}

/** When to reach for it (and when not to), then a short pattern-spotting check. */
export function RecognitionSection({
  slug,
  recognise,
  eyebrow,
}: {
  slug: string
  recognise: LessonV2['recognise']
  eyebrow: string
}) {
  const { useWhen, notWhen, quiz } = recognise
  const [states, setStates] = useState<ItemState[]>(() =>
    quiz.map(() => ({ wrong: [], resolved: false, firstTry: null })),
  )
  const saved = useRef(false)

  const update = (index: number, fn: (state: ItemState) => ItemState) =>
    setStates((prev) => prev.map((state, i) => (i === index ? fn(state) : state)))

  const allResolved = quiz.length > 0 && states.every((state) => state.resolved)
  const firstTryCount = states.filter((state) => state.firstTry).length

  // Save once, when every item is settled: "passed" means a clear majority were spotted first try.
  useEffect(() => {
    if (allResolved && !saved.current) {
      saved.current = true
      saveQuizScore(slug, 'recognition', firstTryCount * 2 > quiz.length)
    }
  }, [allResolved, firstTryCount, quiz.length, slug])

  return (
    <SectionFrame
      id="recognise"
      eyebrow={eyebrow}
      title="Spot it in the wild"
      intro="Most of the skill is noticing the clue in the problem statement."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ClueList title="Reach for it when" items={useWhen} tone="yes" />
        {notWhen.length > 0 ? <ClueList title="Not this when" items={notWhen} tone="no" /> : null}
      </div>

      {quiz.length > 0 ? (
        <>
          <h3 className="t-h3 mb-4 mt-10 text-ink">Which pattern fits?</h3>
          <ol className="space-y-4">
            {quiz.map((item, index) => (
              <RecognitionCard
                key={index}
                item={item}
                index={index}
                total={quiz.length}
                slug={slug}
                state={states[index]}
                onPick={(option) =>
                  update(index, (state) =>
                    option === item.answer
                      ? { ...state, resolved: true, firstTry: state.wrong.length === 0 }
                      : { ...state, wrong: [...state.wrong, option] },
                  )
                }
                onShow={() => update(index, (state) => ({ ...state, resolved: true, firstTry: false }))}
              />
            ))}
          </ol>
          {allResolved ? (
            <p role="status" className="mt-4 text-[15px] text-ink-2">
              {firstTryCount} of {quiz.length} spotted first try.
            </p>
          ) : null}
        </>
      ) : null}
    </SectionFrame>
  )
}
