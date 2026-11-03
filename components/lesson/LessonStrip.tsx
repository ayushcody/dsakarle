'use client'

import { useEffect, useRef } from 'react'

import { cn, focusRing } from '@/components/ui/cn'
import { useLessonSteps } from './LessonShell'
import { SECTION_DEFS } from './sections'

/**
 * Hook → Picture → Watch → Try → Recognise → Code → Practice. Sticky under the
 * top bar on desktop, a horizontal scroller on phones. An item ticks (✓) once
 * its section has been scrolled past.
 */
export function LessonStrip() {
  const { steps, done, activeSection } = useLessonSteps()
  const listRef = useRef<HTMLOListElement>(null)

  // "You are here": the item whose section range holds the reading line. Items
  // that share a section (Watch / Try) resolve to the first one not yet ticked.
  const order = SECTION_DEFS.map((def) => def.id as string)
  const at = activeSection ? order.indexOf(activeSection) : -1
  const covering = steps.filter((step) => order.indexOf(step.target) <= at && at <= order.indexOf(step.endId))
  const lastPassed = steps.filter((step) => order.indexOf(step.endId) < at).pop()
  const currentKey = (covering.find((step) => !done.has(step.key)) ?? covering[0] ?? lastPassed ?? steps[0])?.key

  // Keep the current item visible in the scroller (horizontal only; never moves the page).
  useEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('[data-current="true"]')
    if (!list || !current) return
    const left = current.offsetLeft - (list.clientWidth - current.clientWidth) / 2
    list.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [currentKey])

  if (steps.length === 0) return null

  return (
    <nav
      aria-label="Lesson steps"
      className="sticky top-[64px] z-30 -mx-4 mt-6 border-y border-rule bg-paper px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
    >
      <ol ref={listRef} className="relative flex items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => {
          const isDone = done.has(step.key)
          const isCurrent = step.key === currentKey
          return (
            <li key={step.key} className="flex shrink-0 items-center gap-1">
              <a
                href={`#${step.target}`}
                data-current={isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'inline-flex min-h-[40px] items-center gap-1.5 rounded-pill px-2.5 font-sans text-[14px] transition-colors duration-150',
                  focusRing,
                  isCurrent
                    ? 'bg-coral-wash font-semibold text-coral-ink'
                    : isDone
                      ? 'font-medium text-ink-2 hover:bg-paper-sunken'
                      : 'font-medium text-ink-3 hover:bg-paper-sunken hover:text-ink',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] leading-none',
                    isDone ? 'border-transparent bg-[var(--role-found-wash)] text-role-found' : 'border-rule-strong',
                  )}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                {step.label}
                {isDone ? <span className="sr-only"> (done)</span> : null}
              </a>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="hidden text-ink-3 min-[1700px]:inline md:max-xl:inline">
                  →
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
