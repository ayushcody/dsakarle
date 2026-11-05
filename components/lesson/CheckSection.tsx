'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { markComplete, saveQuizScore } from '@/lib/progress'
import type { ConceptQuestionV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'
import { seededShuffle } from './utils'

interface ShuffledQuestion {
  question: string
  explanation: string
  /** Options in display order; `correct` marks the one the authored `answer` index points at. */
  options: Array<{ text: string; correct: boolean }>
}

function buildQuestions(slug: string, questions: ConceptQuestionV2[]): ShuffledQuestion[] {
  return questions.map((q, index) => {
    const tagged = q.options.map((text, i) => ({ text, correct: i === q.answer }))
    return { question: q.question, explanation: q.explanation, options: seededShuffle(tagged, `${slug}:check:${index}`) }
  })
}

/** Five questions, one at a time: choose, Check, read why, move on. Finishing marks the lesson complete. */
export function CheckSection({
  slug,
  questions,
}: {
  slug: string
  questions: ConceptQuestionV2[]
}) {
  const shuffled = useMemo(() => buildQuestions(slug, questions), [slug, questions])
  const total = shuffled.length
  const groupName = useId()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)
  const restartRef = useRef<HTMLButtonElement>(null)

  const current = shuffled[index]
  const score = results.filter(Boolean).length
  const isCorrect = checked && picked !== null && current.options[picked].correct

  // Move focus to the next action so keyboard learners can keep going.
  useEffect(() => {
    if (checked) nextRef.current?.focus()
  }, [checked])

  useEffect(() => {
    if (finished) restartRef.current?.focus({ preventScroll: true })
  }, [finished])

  const check = () => {
    if (picked === null || checked) return
    setChecked(true)
    setResults((prev) => {
      const next = prev.slice()
      next[index] = current.options[picked].correct
      return next
    })
  }

  const advance = () => {
    if (index + 1 < total) {
      setIndex(index + 1)
      setPicked(null)
      setChecked(false)
      return
    }
    const finalScore = results.filter(Boolean).length
    setFinished(true)
    markComplete(slug)
    saveQuizScore(slug, 'concept', finalScore)
  }

  const restart = () => {
    setIndex(0)
    setPicked(null)
    setChecked(false)
    setResults([])
    setFinished(false)
  }

  if (total === 0) return null

  return (
    <SectionFrame id="check">
      <p className="mb-3 text-[16px] leading-7 text-ink-2">
        Test yourself first. Try to answer these in your own words, then take the quiz below to check.
      </p>
      <ol className="mb-8 list-decimal space-y-2 pl-6 text-[16px] leading-7 text-ink">
        {questions.map((q, i) => (
          <li key={i}>{q.question}</li>
        ))}
      </ol>
      <div className="rounded-card border border-rule bg-paper-raised p-5 sm:p-6">
        {finished ? (
          <div role="status" aria-live="polite">
            <p className="t-eyebrow mb-2">Your score</p>
            <p className="font-serif text-[40px] font-semibold leading-none text-ink">
              {score} <span className="text-ink-3">of {total}</span>
            </p>
            <p className="mt-3 text-[16px] leading-6 text-ink-2">
              {score === total
                ? 'Clean sweep. This lesson is marked complete.'
                : score * 2 >= total
                  ? 'Solid. This lesson is marked complete; the misses below are worth another look.'
                  : 'This lesson is marked complete. Skim the explanations below, then try again whenever you like.'}
            </p>
            <ol className="mt-5 space-y-3">
              {shuffled.map((q, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-6">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none',
                      results[i] ? 'bg-[var(--role-found-wash)] text-found-ink' : 'bg-[var(--role-error-wash)] text-error-ink',
                    )}
                  >
                    {results[i] ? '✓' : '✕'}
                  </span>
                  <span className="text-ink-2">
                    <span className="sr-only">{results[i] ? 'Correct. ' : 'Missed. '}</span>
                    <span className="font-medium text-ink">{q.question}</span> {q.explanation}
                  </span>
                </li>
              ))}
            </ol>
            <Button ref={restartRef as React.Ref<HTMLButtonElement>} variant="secondary" className="mt-6" onClick={restart}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="t-eyebrow">
                Question {index + 1} of {total}
              </p>
              <ol className="flex gap-1.5" aria-hidden="true">
                {shuffled.map((_, i) => (
                  <li
                    key={i}
                    className={cn(
                      'h-2 w-6 rounded-full',
                      i < index || (i === index && checked) ? 'bg-coral' : i === index ? 'bg-coral-wash ring-1 ring-coral' : 'bg-rule-strong',
                    )}
                  />
                ))}
              </ol>
            </div>

            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-4 font-serif text-[20px] font-semibold leading-7 text-ink">{current.question}</legend>
              <div className="space-y-2.5">
                {current.options.map((option, i) => {
                  const selected = picked === i
                  const showRight = checked && option.correct
                  const showWrong = checked && selected && !option.correct
                  return (
                    <label
                      key={`${index}-${i}`}
                      className={cn(
                        'relative flex min-h-[48px] cursor-pointer items-start gap-3 rounded-card border px-4 py-3 text-[16px] leading-6 transition-colors duration-150',
                        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
                        showRight
                          ? 'border-role-found bg-[var(--role-found-wash)] text-ink'
                          : showWrong
                            ? 'border-role-error bg-[var(--role-error-wash)] text-ink'
                            : selected
                              ? 'border-coral bg-coral-wash text-ink'
                              : 'border-rule bg-paper text-ink-2 hover:border-rule-strong',
                        checked && 'cursor-default',
                      )}
                    >
                      <input
                        type="radio"
                        name={`${groupName}-${index}`}
                        className="sr-only"
                        checked={selected}
                        disabled={checked}
                        onChange={() => setPicked(i)}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold leading-none',
                          showRight
                            ? 'border-found-ink bg-found-ink text-paper'
                            : showWrong
                              ? 'border-error-ink bg-error-ink text-paper'
                              : selected
                                ? 'border-coral bg-coral'
                                : 'border-rule-strong',
                        )}
                      >
                        {showRight ? '✓' : showWrong ? '✕' : selected ? <span className="h-1.5 w-1.5 rounded-full bg-paper" /> : null}
                      </span>
                      <span className="min-w-0">
                        {option.text}
                        {showRight ? <span className="sr-only"> (correct answer)</span> : null}
                        {showWrong ? <span className="sr-only"> (your answer, not correct)</span> : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div aria-live="polite" className="mt-4 empty:mt-0">
              {checked ? (
                <div
                  className={cn(
                    'rounded-r-card border-l-[3px] px-4 py-3',
                    isCorrect ? 'border-l-role-found bg-[var(--role-found-wash)]' : 'border-l-role-error bg-[var(--role-error-wash)]',
                  )}
                >
                  <p className={cn('text-[15px] font-semibold', isCorrect ? 'text-found-ink' : 'text-error-ink')}>
                    <span aria-hidden="true">{isCorrect ? '✓ ' : '✕ '}</span>
                    {isCorrect ? 'Correct.' : 'Not quite.'}
                  </p>
                  <p className="mt-1 text-[15px] leading-6 text-ink-2">{current.explanation}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              {checked ? (
                <Button ref={nextRef as React.Ref<HTMLButtonElement>} onClick={advance}>
                  {index + 1 < total ? 'Next question' : 'See my score'}
                </Button>
              ) : (
                <Button onClick={check} disabled={picked === null}>
                  Check my answer
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </SectionFrame>
  )
}
