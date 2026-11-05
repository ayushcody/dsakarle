'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Glyph } from '@/components/glyph'
import { Button, Chip, SegmentedControl, cn, focusRing } from '@/components/ui'
import { PATHS } from '@/lib/curriculum'
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
type DifficultyFilter = 'all' | ProblemDifficulty

const DIFFICULTY_LABEL: Record<ProblemDifficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

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

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5" />
    </svg>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border',
        on ? 'border-coral-ink bg-coral-ink text-paper' : 'border-control bg-transparent text-transparent',
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5l3.2 3.2L13 4.8" />
      </svg>
    </span>
  )
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
  const hintId = useId()

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex min-h-[40px] max-w-full items-center gap-1.5 rounded-cell text-[16px] font-semibold leading-6 text-ink hover:text-coral-ink', focusRing)}
          >
            <span className="min-w-0 break-words">{item.title}</span>
            <ExternalIcon />
            <span className="sr-only"> (opens LeetCode in a new tab)</span>
          </a>
          <p className="t-caption flex flex-wrap items-center gap-x-2 text-ink-3">
            <span className="text-ink-2">{DIFFICULTY_LABEL[item.difficulty]}</span>
            {lesson ? (
              <>
                <span aria-hidden="true">·</span>
                <Link
                  href={`/learn/${lesson.slug}`}
                  aria-label={`Open the ${lesson.title} lesson`}
                  className={cn('-my-[5px] inline-flex min-h-10 items-center gap-1 rounded-cell py-1.5 text-ink-2 underline decoration-rule-strong underline-offset-2 hover:text-coral-ink', focusRing)}
                >
                  <Glyph id={lesson.glyph} size={16} decorative />
                  {lesson.title}
                </Link>
              </>
            ) : null}
            {item.workedExample ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Worked in the lesson</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:shrink-0">
          {item.insight ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={hintId}
              onClick={() => setOpen((v) => !v)}
              className={cn('inline-flex min-h-[40px] items-center gap-1 rounded-cell px-3 text-[14px] font-medium text-ink-2 hover:bg-paper-sunken hover:text-ink', focusRing)}
            >
              Hint
              <svg aria-hidden="true" viewBox="0 0 16 16" className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6l5 5 5-5" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            aria-pressed={solved}
            onClick={() => onToggle(item.url)}
            className={cn(
              'inline-flex min-h-[40px] items-center gap-2 rounded-cell px-3 text-[14px] font-medium hover:bg-paper-sunken',
              solved ? 'text-coral-ink' : 'text-ink-2 hover:text-ink',
              focusRing,
            )}
          >
            <Check on={solved} />
            {solved ? 'Solved' : 'Mark solved'}
          </button>
        </div>
      </div>
      {item.insight && open ? (
        <p id={hintId} className="mt-1 max-w-[64ch] rounded-cell bg-paper-sunken px-3 py-2 text-[15px] leading-6 text-ink-2">
          {item.insight}
        </p>
      ) : null}
    </li>
  )
}

/** Compact multi-select: a button that opens a panel of glyph chips. Esc or an outside click closes it. */
function PatternPopover({
  lessons,
  picked,
  onToggle,
  onClear,
}: {
  lessons: PracticeBrowserLesson[]
  picked: string[]
  onToggle: (slug: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-card border border-control bg-paper-raised px-3 text-[15px] text-ink hover:border-ink-3 sm:w-auto',
          focusRing,
        )}
      >
        <span>
          Pattern
          {picked.length ? <span className="ml-1.5 rounded-pill bg-coral-wash px-2 py-0.5 text-[12px] font-semibold text-coral-ink">{picked.length}</span> : null}
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className={cn('h-4 w-4 text-ink-3 transition-transform duration-150', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6l5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div
          id={id}
          role="group"
          aria-label="Pick patterns"
          className="absolute left-0 top-full z-20 mt-2 w-[min(36rem,calc(100vw-2rem))] rounded-card border border-rule bg-paper-raised p-3 shadow-2"
        >
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <Chip
                key={lesson.slug}
                selectable
                selected={picked.includes(lesson.slug)}
                onClick={() => onToggle(lesson.slug)}
                icon={<Glyph id={lesson.glyph} size={16} decorative />}
                className="px-3"
              >
                {lesson.title}
                <span className="font-normal text-ink-3">{lesson.count}</span>
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-rule pt-2">
            <Button variant="ghost" size="sm" onClick={onClear} disabled={picked.length === 0}>
              Clear patterns
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </div>
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
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [status, setStatus] = useState<Status>('all')
  const [solved, setSolved] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
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
    const next = toggleIn(readSolved(), url)
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
        if (difficulty !== 'all' && item.difficulty !== difficulty) return false
        if (status === 'solved' && !solvedSet.has(item.url)) return false
        if (status === 'unsolved' && solvedSet.has(item.url)) return false
        if (needle && !item.title.toLowerCase().includes(needle)) return false
        return true
      }),
    [items, picked, difficulty, status, needle, solvedSet],
  )

  // Path → section → problems (in lesson order). Sections with nothing to show are dropped.
  const groups = useMemo(() => {
    const bySlug = new Map<string, PracticeBrowserItem[]>()
    for (const item of filtered) bySlug.set(item.slug, [...(bySlug.get(item.slug) ?? []), item])
    return PATHS.map((path) => ({
      path,
      sections: path.sections
        .map((section) => ({ section, items: section.lessons.flatMap((slug) => bySlug.get(slug) ?? []) }))
        .filter((s) => s.items.length > 0),
    })).filter((g) => g.sections.length > 0)
  }, [filtered])

  const filtersActive = Boolean(picked.length || difficulty !== 'all' || status !== 'all' || needle)
  const clearAll = () => {
    setPicked([])
    setDifficulty('all')
    setStatus('all')
    setQuery('')
  }

  return (
    <div>
      {/* Toolbar */}
      <section aria-label="Filter problems" className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 lg:w-[16rem]">
          <label htmlFor={searchId} className="sr-only">
            Search by title
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems"
            autoComplete="off"
            className={cn(
              'min-h-[44px] w-full rounded-card border border-control bg-paper-raised px-3 font-sans text-[15px] text-ink placeholder:text-ink-3 hover:border-ink-3',
              focusRing,
            )}
          />
        </div>
        <PatternPopover
          lessons={lessons}
          picked={picked}
          onToggle={(slug) => setPicked((list) => toggleIn(list, slug))}
          onClear={() => setPicked([])}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SegmentedControl<DifficultyFilter>
            aria-label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            className="max-w-full self-start overflow-x-auto"
            options={[
              { value: 'all', label: 'Any' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <SegmentedControl<Status>
            aria-label="Status"
            value={status}
            onChange={setStatus}
            className="max-w-full self-start overflow-x-auto"
            options={[
              { value: 'all', label: 'All' },
              { value: 'unsolved', label: 'Unsolved' },
              { value: 'solved', label: 'Solved' },
            ]}
          />
        </div>
      </section>

      {/* Tally */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-rule pb-3">
        <p role="status" aria-live="polite" className="t-small text-ink-2">
          {filtersActive ? `Showing ${filtered.length} of ${items.length} problems` : `${items.length} problems`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="t-small text-ink-3">
            {!loaded ? ' ' : solvedTotal > 0 ? `${solvedTotal} marked solved` : 'Nothing marked solved yet'}
          </p>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {groups.length ? (
        <div className="mt-8 space-y-12">
          {groups.map(({ path, sections }) => {
            const count = sections.reduce((n, s) => n + s.items.length, 0)
            return (
              <section key={path.id} aria-labelledby={`practice-${path.id}`}>
                <h2 id={`practice-${path.id}`} className="t-h2 scroll-mt-24 text-ink">
                  {path.title}
                  <span className="ml-2 text-[14px] font-normal text-ink-3">
                    {count} {count === 1 ? 'problem' : 'problems'}
                  </span>
                </h2>
                <div className="mt-4 space-y-6">
                  {sections.map(({ section, items: rows }) => (
                    <div key={section.title}>
                      <h3 className="t-eyebrow mb-2">{section.title}</h3>
                      <ul className="divide-y divide-rule rounded-card border border-rule bg-paper-raised">
                        {rows.map((item) => (
                          <ProblemRow
                            key={item.url}
                            item={item}
                            lesson={lessonBySlug.get(item.slug)}
                            solved={solvedSet.has(item.url)}
                            onToggle={toggleSolved}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-dashed border-rule-strong bg-paper-raised px-6 py-10 text-center">
          <p className="t-h3 text-ink">Nothing matches those filters.</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] leading-6 text-ink-2">Try fewer filters, or a shorter search.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
