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

/** The assignment: curated problems as a numbered list, each with a hint (not a solution) and a "solved" toggle. */
export function AssignmentSection({ problems }: { problems: PracticeProblemV2[] }) {
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
    <SectionFrame id="assignment" intro="Pick one, try it cold for ten minutes, then come back for the hint.">
      <p role="status" className="t-caption mb-3 text-ink-3">
        {solvedHere} of {problems.length} solved
      </p>
      <ol className="m-0 list-decimal space-y-6 pl-6 text-[16px] leading-7 text-ink marker:font-semibold marker:text-ink-3">
        {problems.map((problem, index) => {
          const titleId = `${idBase}-${index}-title`
          const difficulty = PROBLEM_DIFFICULTY[problem.difficulty]
          const isSolved = solved.includes(problem.url)
          return (
            <li key={problem.url} className="pl-1">
              <p id={titleId} className="m-0">
                Solve{' '}
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-cell font-semibold text-coral-ink underline underline-offset-4 ${focusRing}`}
                >
                  {problem.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{' '}
                <span className="text-ink-2">(LeetCode, {difficulty.label.toLowerCase()})</span>
              </p>
              <p className="mt-1 text-[15px] leading-6 text-ink-2">
                <span className="font-semibold text-ink">Hint: </span>
                {problem.insight}
              </p>
              <div className="mt-2">
                <Chip selectable selected={isSolved} onClick={() => toggle(problem.url)} aria-describedby={titleId}>
                  {isSolved ? 'Solved ✓' : 'Mark solved'}
                </Chip>
              </div>
            </li>
          )
        })}
      </ol>
    </SectionFrame>
  )
}
