'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { Glyph } from '@/components/glyph'
import { Button, Chip, SegmentedControl, cn, focusRing } from '@/components/ui'
import type { ChipVariant } from '@/components/ui'
import type { GlyphId, ProblemDifficulty } from '@/types/learning'

const SOLVED_KEY = 'dsakarle-solved'

export interface PracticeBrowserItem {
  url: string
  title: string
  difficulty: ProblemDifficulty
  slug: string
  insight: string | null
  workedExample: boolean
}

export interface PracticeBrowserLesson {
  slug: string
  title: string
  glyph: GlyphId
  count: number
}

type Status = 'all' | 'unsolved' | 'solved'

const DIFFICULTY: Record<ProblemDifficulty, { label: string; variant: ChipVariant }> = {
  easy: { label: 'Easy', variant: 'found' },
  medium: { label: 'Medium', variant: 'amber' },
  hard: { label: 'Hard', variant: 'error' },
}
const DIFFICULTY_ORDER: ProblemDifficulty[] = ['easy', 'medium', 'hard']

function readSolved(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SOLVED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeSolved(urls: string[]) {
  try {
    window.localStorage.setItem(SOLVED_KEY, JSON.stringify(urls))
  } catch {
    // Storage unavailable: the toggle still works for this visit.
  }
}

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5" />
    </svg>
  )
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ProblemRow({
  item,
  lesson,
  solved,
  onToggle,
}: {
  item: PracticeBrowserItem
  lesson: PracticeBrowserLesson | undefined
  solved: boolean
  onToggle: (url: string) => void
}) {
  const [open, setOpen] = useState(false)
  const insightId = useId()
  const titleId = `${insightId}-title`
  const difficulty = DIFFICULTY[item.difficulty]
  const longInsight = (item.insight?.length ?? 0) > 70

  return (
    <li className="rounded-card border border-rule bg-paper-raised p-4 shadow-1 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 id={titleId} className="min-w-0 font-serif text-[18px] font-semibold leading-6 text-ink">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('inline-flex min-h-[40px] items-center gap-1.5 rounded-cell text-ink underline decoration-rule-strong underline-offset-4 hover:text-coral-ink hover:decoration-coral', focusRing)}
              >
                <span className="min-w-0 break-words">{item.title}</span>
                <ExternalIcon />
                <span className="sr-only"> (opens LeetCode in a new tab)</span>
              </a>
            </h3>
            <Chip variant={difficulty.variant}>{difficulty.label}</Chip>
            {item.workedExample ? <Chip variant="teal">Worked example</Chip> : null}
          </div>

          {item.insight ? (
            <div className="mt-1 max-w-[64ch]">
              <p
                id={insightId}
                className={cn('text-[15px] leading-6 text-ink-2', !open && 'line-clamp-1')}
              >
                <span className="font-semibold text-ink">Hint: </span>
                {item.insight}
              </p>
              {longInsight ? (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={insightId}
                  onClick={() => setOpen((v) => !v)}
                  className={cn('-my-1 mt-0.5 inline-flex min-h-[40px] items-center rounded-cell text-[13px] font-semibold text-coral-ink underline underline-offset-4', focusRing)}
                >
                  {open ? 'Show less' : 'Show the whole hint'}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-[15px] leading-6 text-ink-3">Solved step by step inside the lesson.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {lesson ? (
            <Link
              href={`/learn/${lesson.slug}`}
              className={cn('inline-flex min-h-[40px] items-center rounded-pill', focusRing)}
              aria-label={`Open the ${lesson.title} lesson`}
            >
              <Chip icon={<Glyph id={lesson.glyph} size={16} decorative />} className="hover:border-rule-strong border border-rule bg-paper-sunken text-ink-2">
                {lesson.title}
              </Chip>
            </Link>
          ) : null}
          <Chip selectable selected={solved} aria-describedby={titleId} onClick={() => onToggle(item.url)}>
            I solved this
          </Chip>
        </div>
      </div>
    </li>
  )
}

export function PracticeBrowser({
  items,
  lessons,
}: {
  items: PracticeBrowserItem[]
  lessons: PracticeBrowserLesson[]
}) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [difficulties, setDifficulties] = useState<ProblemDifficulty[]>([])
  const [status, setStatus] = useState<Status>('all')
  const [solved, setSolved] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)
  const searchId = useId()

  useEffect(() => {
    setSolved(readSolved())
    setLoaded(true)
    const onStorage = (event: StorageEvent) => {
      if (event.key === SOLVED_KEY || event.key === null) setSolved(readSolved())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleSolved = useCallback((url: string) => {
    // Re-read first so a change made in another tab is not overwritten.
    const current = readSolved()
    const next = toggleIn(current, url)
    writeSolved(next)
    setSolved(next)
  }, [])

  const lessonBySlug = useMemo(() => new Map(lessons.map((l) => [l.slug, l])), [lessons])
  const solvedSet = useMemo(() => new Set(solved), [solved])
  const solvedTotal = useMemo(() => items.filter((i) => solvedSet.has(i.url)).length, [items, solvedSet])

  const needle = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (picked.length && !picked.includes(item.slug)) return false
        if (difficulties.length && !difficulties.includes(item.difficulty)) return false
        if (status === 'solved' && !solvedSet.has(item.url)) return false
        if (status === 'unsolved' && solvedSet.has(item.url)) return false
        if (needle && !item.title.toLowerCase().includes(needle)) return false
        return true
      }),
    [items, picked, difficulties, status, needle, solvedSet],
  )

  const filtersActive = Boolean(picked.length || difficulties.length || status !== 'all' || needle)
  const clearAll = () => {
    setPicked([])
    setDifficulties([])
    setStatus('all')
    setQuery('')
  }

  return (
    <div>
      {/* Filters */}
      <section aria-label="Filter problems" className="space-y-5 rounded-card border border-rule bg-paper-raised p-4 shadow-1 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <label htmlFor={searchId} className="t-eyebrow mb-2 block">
              Search by title
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. two sum, window, palindrome"
              autoComplete="off"
              className={cn(
                'min-h-[44px] w-full rounded-card border border-control bg-paper-sunken px-4 font-sans text-[15px] text-ink placeholder:text-ink-3',
                'hover:border-ink-3',
                focusRing,
              )}
            />
          </div>
          <div>
            <p id={`${searchId}-status`} className="t-eyebrow mb-2">
              Status
            </p>
            <SegmentedControl<Status>
              aria-labelledby={`${searchId}-status`}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All' },
                { value: 'unsolved', label: 'Unsolved' },
                { value: 'solved', label: 'Solved' },
              ]}
            />
          </div>
        </div>

        <div>
          <p className="t-eyebrow mb-2">Difficulty</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
            {DIFFICULTY_ORDER.map((d) => (
              <Chip
                key={d}
                selectable
                selected={difficulties.includes(d)}
                onClick={() => setDifficulties((list) => toggleIn(list, d))}
              >
                {DIFFICULTY[d].label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="t-eyebrow" id={`${searchId}-pattern`}>
              Pattern{picked.length ? ` (${picked.length} picked)` : ''}
            </p>
            <button
              type="button"
              aria-expanded={showPatterns}
              aria-controls={`${searchId}-patterns`}
              onClick={() => setShowPatterns((v) => !v)}
              className={cn('inline-flex min-h-[40px] items-center rounded-cell px-1 text-[13px] font-semibold text-coral-ink underline underline-offset-4 md:hidden', focusRing)}
            >
              {showPatterns ? 'Hide patterns' : 'Show patterns'}
            </button>
          </div>
          <div
            id={`${searchId}-patterns`}
            role="group"
            aria-labelledby={`${searchId}-pattern`}
            className={cn('flex-wrap gap-2', showPatterns ? 'flex' : 'hidden md:flex')}
          >
            {lessons.map((lesson) => (
              <Chip
                key={lesson.slug}
                selectable
                selected={picked.includes(lesson.slug)}
                onClick={() => setPicked((list) => toggleIn(list, lesson.slug))}
                icon={<Glyph id={lesson.glyph} size={24} decorative />}
              >
                {lesson.title}
                <span className="font-normal text-ink-3">{lesson.count}</span>
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Tally + result count */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p role="status" aria-live="polite" className="t-small text-ink-2">
          {filtersActive
            ? `Showing ${filtered.length} of ${items.length} problems`
            : `${items.length} problems`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="t-small text-ink-2">
            {!loaded
              ? ' '
              : solvedTotal > 0
                ? `You've marked ${solvedTotal} as solved`
                : 'Nothing marked as solved yet'}
          </p>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {/* List. The h2 is screen-reader-only; it keeps the order h1 > h2 > h3 for the problem titles. */}
      <h2 className="sr-only">Problems</h2>
      {filtered.length ? (
        <ul className="mt-4 space-y-3">
          {filtered.map((item) => (
            <ProblemRow
              key={item.url}
              item={item}
              lesson={lessonBySlug.get(item.slug)}
              solved={solvedSet.has(item.url)}
              onToggle={toggleSolved}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-rule-strong bg-paper-raised px-6 py-10 text-center">
          <p className="font-serif text-[20px] font-semibold text-ink">Nothing matches those filters.</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] leading-6 text-ink-2">
            Try fewer filters, or a shorter search.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
