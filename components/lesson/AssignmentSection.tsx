'use client'

import { useEffect, useId, useState } from 'react'

import { Chip } from '@/components/ui/Chip'
import { focusRing } from '@/components/ui/cn'
import type { PracticeProblemV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'
import { PROBLEM_DIFFICULTY } from './utils'

const SOLVED_KEY = 'dsakarle-solved'

function readSolved(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SOLVED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

function writeSolved(urls: string[]) {
  try {
    window.localStorage.setItem(SOLVED_KEY, JSON.stringify(urls))
  } catch {
    // Storage unavailable: the toggle works for this visit only.
  }
}

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5" />
    </svg>
  )
}

/** Where to take it next: curated problems, each with a hint (not a solution) and a "solved" toggle. */
export function PracticeSection({ problems, eyebrow }: { problems: PracticeProblemV2[]; eyebrow: string }) {
  const [solved, setSolved] = useState<string[]>([])
  const idBase = useId()

  useEffect(() => {
    setSolved(readSolved())
    const onStorage = (event: StorageEvent) => {
      if (event.key === SOLVED_KEY || event.key === null) setSolved(readSolved())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = (url: string) => {
    // Re-read first so a toggle in another tab is not overwritten.
    const current = readSolved()
    const next = current.includes(url) ? current.filter((u) => u !== url) : [...current, url]
    writeSolved(next)
    setSolved(next)
  }

  const solvedHere = problems.filter((problem) => solved.includes(problem.url)).length

  return (
    <SectionFrame
      id="practice"
      eyebrow={eyebrow}
      title="Now make it yours"
      intro="Pick one, try it cold for ten minutes, then come back for the hint."
    >
      <p role="status" className="t-caption mb-3 text-ink-3">
        {solvedHere} of {problems.length} solved
      </p>
      <ul className="space-y-3">
        {problems.map((problem, index) => {
          const titleId = `${idBase}-${index}-title`
          const difficulty = PROBLEM_DIFFICULTY[problem.difficulty]
          const isSolved = solved.includes(problem.url)
          return (
            <li key={problem.url} className="rounded-card border border-rule bg-paper-raised p-4 shadow-1 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 id={titleId} className="t-h3 text-ink">{problem.title}</h3>
                    <Chip variant={difficulty.variant}>{difficulty.label}</Chip>
                  </div>
                  <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-ink-2">
                    <span className="font-semibold text-ink">Hint: </span>
                    {problem.insight}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-cell text-[14px] font-semibold text-coral-ink underline underline-offset-4 ${focusRing}`}
                >
                  Open on LeetCode
                  <ExternalIcon />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <Chip selectable selected={isSolved} onClick={() => toggle(problem.url)} aria-describedby={titleId}>
                  {isSolved ? 'Solved' : 'I solved this'}
                </Chip>
              </div>
            </li>
          )
        })}
      </ul>
    </SectionFrame>
  )
}
