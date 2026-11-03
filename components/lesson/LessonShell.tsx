'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { Sidebar } from '@/components/layout/Sidebar'
import { RightSidebar } from '@/components/topic/RightSidebar'
import { setLastVisited } from '@/lib/progress'
import type { OutlineItem } from '@/components/topic/RightSidebar'
import type { StepDef } from './sections'

interface LessonStepsValue {
  steps: StepDef[]
  done: ReadonlySet<string>
  /** The section nearest the reading line (scroll-spy), or null above the first one. */
  activeSection: string | null
  markStep: (key: string) => void
}

const LessonStepsContext = createContext<LessonStepsValue>({ steps: [], done: new Set(), activeSection: null, markStep: () => {} })

/** Which strip items are ticked, and a way for interactive sections to tick one early. */
export function useLessonSteps(): LessonStepsValue {
  return useContext(LessonStepsContext)
}

const storageKey = (slug: string) => `dsakarle-lesson-steps:${slug}`

/** Scroll-past offset: site header (64) + sticky strip (~56). A section counts as "past" once its bottom crosses it. */
const PAST_MARGIN = 120

interface LessonShellProps {
  slug: string
  steps: StepDef[]
  outline: OutlineItem[]
  children: ReactNode
}

/**
 * Client frame for a v2 lesson: left lesson sidebar, the main column, the right
 * outline rail, and the scrolled-past tracking behind the progress strip.
 * The sections themselves arrive as server-rendered children.
 */
export function LessonShell({ slug, steps, outline, children }: LessonShellProps) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set())
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const loaded = useRef(false)

  // Remember where the learner is, for "Continue where you left off".
  useEffect(() => {
    setLastVisited(slug)
  }, [slug])

  // Restore this lesson's ticks for the current tab session.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey(slug))
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        const valid = new Set(steps.map((step) => step.key))
        const restored = parsed.filter((key): key is string => typeof key === 'string' && valid.has(key))
        if (restored.length > 0) setDone((prev) => new Set([...Array.from(prev), ...restored]))
      }
    } catch {
      // sessionStorage unavailable: ticks just won't survive a reload.
    }
    loaded.current = true
  }, [slug, steps])

  useEffect(() => {
    if (!loaded.current || done.size === 0) return
    try {
      window.sessionStorage.setItem(storageKey(slug), JSON.stringify(Array.from(done)))
    } catch {
      // ignore
    }
  }, [slug, done])

  const markStep = useCallback((key: string) => {
    setDone((prev) => (prev.has(key) ? prev : new Set([...Array.from(prev), key])))
  }, [])

  // Tick an item once its end section has scrolled above the sticky chrome.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const byEnd = new Map<string, string[]>()
    for (const step of steps) byEnd.set(step.endId, [...(byEnd.get(step.endId) ?? []), step.key])

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) continue
          const top = entry.rootBounds?.top ?? PAST_MARGIN
          if (entry.boundingClientRect.bottom <= top + 1) {
            for (const key of byEnd.get(entry.target.id) ?? []) markStep(key)
          }
        }
      },
      { rootMargin: `-${PAST_MARGIN}px 0px 0px 0px` },
    )
    byEnd.forEach((_keys, id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [steps, markStep])

  // Scroll-spy for the strip's "you are here" item.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ids = outline.map((item) => item.id)
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActiveSection(first)
      },
      { rootMargin: `-${PAST_MARGIN}px 0px -55% 0px` },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [outline])

  const value = useMemo(() => ({ steps, done, activeSection, markStep }), [steps, done, activeSection, markStep])
  const railSteps = useMemo(
    () => steps.map((step) => ({ key: step.key, label: step.label, done: done.has(step.key) })),
    [steps, done],
  )

  return (
    <LessonStepsContext.Provider value={value}>
      <Sidebar currentSlug={slug} />
      {/* The layout already pads 64px for the fixed SiteHeader; the Sidebar rail sits below it (md+). */}
      <div className="min-h-[calc(100vh-4rem)] bg-paper text-ink md:ml-[280px]">
        <div className="mx-auto flex max-w-[1400px] gap-12 px-4 py-8 sm:px-6 md:py-10 xl:px-12">
          <main id="lesson-main" className="w-full min-w-0 max-w-[1040px] flex-1">
            {children}
          </main>
          <RightSidebar outline={outline} steps={railSteps} />
        </div>
      </div>
    </LessonStepsContext.Provider>
  )
}
