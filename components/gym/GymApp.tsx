'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Glyph, glyphForSlug } from '@/components/glyph'
import { Button } from '@/components/ui/Button'
import { cn, focusRing } from '@/components/ui/cn'
import { getLessonMeta, getPath, PATHS } from '@/lib/curriculum'
import {
  type Answer,
  type GymItem,
  type GymMode,
  type GymQuestion,
  GYM_KEY,
  applySession,
  bestStreak,
  breakdown,
  buildSession,
  emptyStore,
  isValidSeed,
  newSeed,
  parseStore,
  scoreOf,
  sessionSize,
  type GymStore,
} from '@/lib/gym'

import { ModeChip } from './ModeChip'

const titleOf = (slug: string) => getLessonMeta(slug)?.title ?? slug

function readStore(): GymStore {
  try {
    return parseStore(window.localStorage.getItem(GYM_KEY))
  } catch {
    return emptyStore()
  }
}
function writeStore(store: GymStore) {
  try {
    window.localStorage.setItem(GYM_KEY, JSON.stringify(store))
  } catch {
    /* storage unavailable: the gym still works, it just won't remember */
  }
}

function syncUrl(seed: string | null, mode: GymMode) {
  try {
    const url = new URL(window.location.href)
    if (seed) url.searchParams.set('seed', seed)
    else url.searchParams.delete('seed')
    if (mode !== 'quick') url.searchParams.set('mode', mode)
    else url.searchParams.delete('mode')
    window.history.replaceState(null, '', url)
  } catch {
    /* ignore */
  }
}

export function GymApp({ items }: { items: GymItem[] }) {
  const [mounted, setMounted] = useState(false)
  const [store, setStore] = useState<GymStore>(emptyStore)
  const [mode, setMode] = useState<GymMode>('quick')
  const [seed, setSeed] = useState('')
  const [questions, setQuestions] = useState<GymQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m = params.get('mode')
    if (m === 'all' || (m && getPath(m))) setMode(m)
    const s = params.get('seed')
    setSeed(isValidSeed(s) ? s : newSeed())
    setStore(readStore())
    setMounted(true)
  }, [])

  const pool = useMemo(() => {
    if (mode === 'quick' || mode === 'all') return items
    const slugs = new Set(getPath(mode)?.sections.flatMap((s) => s.lessons) ?? [])
    return items.filter((i) => slugs.has(i.answer))
  }, [items, mode])

  const start = useCallback(
    (useSeed: string) => {
      const qs = buildSession(pool, { count: sessionSize(mode), seed: useSeed, missed: store.missed })
      setSeed(useSeed)
      setQuestions(qs)
      setAnswers([])
      setChosen(null)
      syncUrl(useSeed, mode)
    },
    [pool, mode, store.missed],
  )

  const backToStart = () => {
    setQuestions(null)
    setSeed(newSeed())
    syncUrl(null, mode)
  }

  if (!mounted) return <div className="mt-8 h-64 rounded-card border border-rule bg-paper-raised" aria-hidden="true" />

  const finished = questions !== null && answers.length === questions.length && questions.length > 0

  const finish = (all: Answer[]) => {
    const next = applySession(store, all)
    setStore(next)
    writeStore(next)
  }

  if (!questions) {
    const count = Math.min(sessionSize(mode), pool.length)
    return (
      <section aria-labelledby="gym-setup" className="mt-8 rounded-card border border-rule bg-paper-raised p-5 sm:p-6">
        <h2 id="gym-setup" className="t-h3 text-ink">
          Pick a set
        </h2>
        <div role="group" aria-label="Question set" className="mt-4 flex flex-wrap gap-2">
          <ModeChip selected={mode === 'quick'} onClick={() => setMode('quick')}>
            Quick 10
          </ModeChip>
          <ModeChip selected={mode === 'all'} onClick={() => setMode('all')}>
            All patterns (20)
          </ModeChip>
        </div>
        <p className="t-eyebrow mb-2 mt-6">Or drill one path</p>
        <div role="group" aria-label="Filter by path" className="flex flex-wrap gap-2">
          {PATHS.map((p) => (
            <ModeChip key={p.id} selected={mode === p.id} onClick={() => setMode(p.id)}>
              {p.title}
            </ModeChip>
          ))}
        </div>

        {pool.length === 0 ? (
          <p className="mt-6 text-[15px] leading-6 text-ink-2">
            No drills here yet. This path is still being written, so try another set while we finish it.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Button onClick={() => start(seed)}>Start {count} questions</Button>
              <p className="text-[14px] text-ink-3">
                Set code <span className="font-mono text-ink-2">{seed}</span>. Share it and a friend gets the same set.
              </p>
            </div>
            <p className="mt-4 text-[14px] leading-6 text-ink-3">
              {store.attempts === 0
                ? 'Nothing to catch you out. Every answer comes with a short reason, and your first set is just a warm-up.'
                : `${store.attempts} ${store.attempts === 1 ? 'set' : 'sets'} done, best ${store.bestScore}%. Patterns you missed come back more often.`}
            </p>
          </>
        )}
      </section>
    )
  }

  if (finished) {
    return (
      <Results
        questions={questions}
        answers={answers}
        seed={seed}
        store={store}
        onAgain={() => start(seed)}
        onNew={() => {
          const s = newSeed()
          start(s)
        }}
        onBack={backToStart}
      />
    )
  }

  const index = answers.length
  const q = questions[index]
  const streak = (() => {
    let r = 0
    for (let i = answers.length - 1; i >= 0 && answers[i].chosen === answers[i].answer; i--) r++
    return r
  })()

  return (
    <Question
      key={q.id}
      q={q}
      index={index}
      total={questions.length}
      streak={streak}
      seed={seed}
      chosen={chosen}
      onPick={(slug) => {
        if (chosen) return
        setChosen(slug)
      }}
      onNext={() => {
        if (!chosen) return
        const all = [...answers, { id: q.id, answer: q.answer, chosen }]
        setAnswers(all)
        setChosen(null)
        if (all.length === questions.length) finish(all)
      }}
      isLast={index === questions.length - 1}
    />
  )
}

function Question({
  q,
  index,
  total,
  streak,
  seed,
  chosen,
  onPick,
  onNext,
  isLast,
}: {
  q: GymQuestion
  index: number
  total: number
  streak: number
  seed: string
  chosen: string | null
  onPick: (slug: string) => void
  onNext: () => void
  isLast: boolean
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const answered = chosen !== null
  const correct = chosen === q.answer

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true })
  }, [answered])

  const pickRef = useRef(onPick)
  pickRef.current = onPick
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (!answered && n >= 1 && n <= q.shuffled.length) {
        pickRef.current(q.shuffled[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, q.shuffled])

  return (
    <section aria-labelledby="gym-q" className="mt-8 rounded-card border border-rule bg-paper-raised p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="t-eyebrow">
          Question {index + 1} of {total}
        </p>
        <p className="text-[14px] text-ink-2" aria-label={`Streak ${streak}`}>
          <span aria-hidden="true">Streak </span>
          <span className="font-mono font-semibold text-ink">{streak}</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + (answered ? 1 : 0)}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-sunken"
      >
        <div
          className="h-full rounded-full bg-coral-ink transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <h2 id="gym-q" ref={headingRef} tabIndex={-1} className="mt-6 text-[18px] font-medium leading-7 text-ink outline-none">
        <span className="sr-only">Which pattern is this? </span>
        {q.problem}
      </h2>

      <div role="group" aria-label="Choose a pattern" className="mt-5 grid gap-2 sm:grid-cols-2">
        {q.shuffled.map((slug, i) => {
          const isAnswer = slug === q.answer
          const isChosen = slug === chosen
          const showRight = answered && isAnswer
          const showWrong = answered && isChosen && !isAnswer
          return (
            <button
              key={slug}
              type="button"
              aria-disabled={answered || undefined}
              onClick={() => onPick(slug)}
              className={cn(
                focusRing,
                'flex min-h-[48px] items-center gap-3 rounded-card border bg-paper-raised px-3 py-2 text-left text-[15px] font-medium text-ink transition-colors motion-reduce:transition-none',
                !answered && 'border-rule hover:border-coral-ink hover:bg-coral-wash',
                answered && !showRight && !showWrong && 'cursor-default border-rule text-ink-3',
                showRight && 'cursor-default border-role-found bg-[var(--role-found-wash)]',
                showWrong && 'cursor-default border-role-error bg-[var(--role-error-wash)]',
              )}
            >
              <span className="font-mono text-[12px] text-ink-3" aria-hidden="true">
                {i + 1}
              </span>
              <Glyph id={glyphForSlug(slug)} size={24} decorative />
              <span className="flex-1">{titleOf(slug)}</span>
              {showRight ? (
                <span aria-hidden="true" className="font-bold text-found-ink">
                  ✓
                </span>
              ) : null}
              {showWrong ? (
                <span aria-hidden="true" className="font-bold text-error-ink">
                  ✕
                </span>
              ) : null}
              {showRight ? <span className="sr-only">(correct answer)</span> : null}
              {showWrong ? <span className="sr-only">(your answer, not correct)</span> : null}
            </button>
          )
        })}
      </div>

      <div aria-live="polite" className="mt-5 empty:mt-0">
        {answered ? (
          <div
            className={cn(
              'rounded-r-card border-l-[3px] px-4 py-3',
              correct
                ? 'border-l-role-found bg-[var(--role-found-wash)]'
                : 'border-l-role-error bg-[var(--role-error-wash)]',
            )}
          >
            <p className={cn('text-[15px] font-semibold', correct ? 'text-found-ink' : 'text-error-ink')}>
              {correct ? <>✓ Correct. {titleOf(q.answer)}.</> : <>✕ Not quite. It was {titleOf(q.answer)}.</>}
            </p>
            <p className="mt-1 text-[15px] leading-6 text-ink-2">{q.explanation}</p>
            <Link
              href={`/learn/${q.answer}#recognise`}
              className={cn(focusRing, 'mt-2 inline-block rounded-cell text-[14px] text-coral-ink underline underline-offset-4')}
            >
              Review: {titleOf(q.answer)}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="hidden text-[13px] text-ink-3 sm:block">
          Press 1 to {q.shuffled.length} to answer{answered ? ', Enter for next' : ''}. Set {seed}.
        </p>
        {answered ? (
          <Button ref={nextRef} onClick={onNext} className="ml-auto">
            {isLast ? 'See results' : 'Next question'}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function Results({
  questions,
  answers,
  seed,
  store,
  onAgain,
  onNew,
  onBack,
}: {
  questions: GymQuestion[]
  answers: Answer[]
  seed: string
  store: GymStore
  onAgain: () => void
  onNew: () => void
  onBack: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [])
  const { right, total, percent } = scoreOf(answers)
  const streak = bestStreak(answers)
  const per = breakdown(answers)
  const missed = Object.entries(per).filter(([, t]) => t.right < t.total)
  const nailed = Object.entries(per).filter(([, t]) => t.right === t.total)
  const message =
    percent === 100
      ? 'A clean sweep. You are reading problems the way interviewers hope you will.'
      : percent >= 70
        ? 'Strong set. The ones you missed are the quickest wins, and they will come back to help.'
        : 'Good reps. Missing a pattern here is cheap, and every explanation you read makes the next one easier to spot.'
  void questions

  return (
    <section aria-labelledby="gym-results" className="mt-8 rounded-card border border-rule bg-paper-raised p-5 sm:p-6">
      <p className="t-eyebrow mb-2">Set complete</p>
      <h2 id="gym-results" ref={headingRef} tabIndex={-1} className="t-h2 text-ink outline-none">
        {right} of {total} ({percent}%)
      </h2>
      <p className="mt-2 text-[15px] leading-6 text-ink-2">{message}</p>
      <p className="mt-2 text-[14px] text-ink-3">
        Longest streak {streak}. Best score {store.bestScore}%. Set <span className="font-mono">{seed}</span>.
      </p>

      {missed.length > 0 ? (
        <div className="mt-6">
          <h3 className="t-h3 text-ink">Worth another look</h3>
          <ul className="mt-3 divide-y divide-rule rounded-card border border-rule">
            {missed.map(([slug, t]) => (
              <li key={slug}>
                <Link
                  href={`/learn/${slug}#recognise`}
                  className={cn(focusRing, 'flex min-h-[48px] items-center gap-3 rounded-card px-3 py-2 hover:bg-coral-wash')}
                >
                  <Glyph id={glyphForSlug(slug)} size={24} decorative />
                  <span className="flex-1 text-[15px] font-medium text-ink">{titleOf(slug)}</span>
                  <span className="text-[13px] text-error-ink">
                    <span aria-hidden="true">✕ </span>
                    {t.right} of {t.total}
                  </span>
                  <span className="text-[14px] text-coral-ink underline underline-offset-4">Review</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {nailed.length > 0 ? (
        <p className="mt-5 text-[14px] leading-6 text-ink-2">
          <span className="font-semibold text-found-ink">
            <span aria-hidden="true">✓ </span>Spotted every time:
          </span>{' '}
          {nailed.map(([slug]) => titleOf(slug)).join(', ')}.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onNew}>New set</Button>
        <Button variant="secondary" onClick={onAgain}>
          Try again
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Change set
        </Button>
      </div>
    </section>
  )
}
