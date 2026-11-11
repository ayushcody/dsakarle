'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { Sidebar } from '@/components/layout/Sidebar'
import { getLastSection, setLastSection, setLastVisited } from '@/lib/progress'

import { LessonContents } from './LessonContents'
import type { OutlineItem } from './LessonContents'

interface LessonReadingValue {
  outline: OutlineItem[]
  /** The section nearest the reading line (scroll-spy). */
  activeId: string
  /** Sections scrolled past (or completed) during this visit. */
  read: ReadonlySet<string>
  markRead: (id: string) => void
  /** Where the learner left off on an earlier visit, when worth offering. */
  resume: OutlineItem | null
  dismissResume: () => void
}

const LessonReadingContext = createContext<LessonReadingValue>({
  outline: [],
  activeId: '',
  read: new Set(),
  markRead: () => {},
  resume: null,
  dismissResume: () => {},
})

export function useLessonReading(): LessonReadingValue {
  return useContext(LessonReadingContext)
}

/** Site header is 64px; a section counts as passed once its bottom crosses just under it. */
const TOP_MARGIN = 96

interface LessonShellProps {
  slug: string
  outline: OutlineItem[]
  children: ReactNode
}

/**
 * Client frame for a lesson: the path-contents sidebar, the reading column and the
 * "Lesson contents" rail, plus scroll-spy, "sections read" and resume-reading state.
 * The sections themselves arrive as server-rendered children.
 */
export function LessonShell({ slug, outline, children }: LessonShellProps) {
  const [activeId, setActiveId] = useState(outline[0]?.id ?? '')
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set())
  const [resume, setResume] = useState<OutlineItem | null>(null)
  const scrolled = useRef(false)

  const markRead = useCallback((id: string) => {
    setRead((prev) => (prev.has(id) ? prev : new Set([...Array.from(prev), id])))
  }, [])

  // Remember where the learner is for the dashboard, and offer to resume a previous visit (never auto-scroll).
  useEffect(() => {
    setLastVisited(slug)
    const saved = getLastSection(slug)
    const found = saved ? outline.find((item) => item.id === saved) : undefined
    setResume(found && found.id !== outline[0]?.id ? found : null)
  }, [slug, outline])

  // Only start saving once the learner has actually scrolled, so opening a lesson never overwrites the saved spot.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 120) scrolled.current = true
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy plus "read" ticks.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ids = outline.map((item) => item.id)
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else {
            visible.delete(entry.target.id)
            if (entry.boundingClientRect.bottom <= TOP_MARGIN + 1) markRead(entry.target.id)
          }
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActiveId(first)
      },
      { rootMargin: `-${TOP_MARGIN}px 0px -55% 0px` },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [outline, markRead])

  // Debounced save of the section being read.
  useEffect(() => {
    if (!activeId || !scrolled.current) return
    const timer = window.setTimeout(() => setLastSection(slug, activeId), 500)
    return () => window.clearTimeout(timer)
  }, [slug, activeId])

  const dismissResume = useCallback(() => setResume(null), [])

  const value = useMemo(
    () => ({ outline, activeId, read, markRead, resume, dismissResume }),
    [outline, activeId, read, markRead, resume, dismissResume],
  )

  return (
    <LessonReadingContext.Provider value={value}>
      <Sidebar currentSlug={slug} />
      {/* The layout pads 64px for the fixed SiteHeader; the Sidebar rail sits below it (md+). */}
      <div className="min-h-[calc(100vh-4rem)] bg-paper text-ink md:ml-[280px]">
        <div className="mx-auto flex max-w-[1400px] gap-10 px-4 py-8 sm:px-6 md:py-12 xl:px-10">
          <main id="lesson-main" className="w-full min-w-0 flex-1">
            {children}
          </main>
          <LessonContents variant="rail" />
        </div>
      </div>
    </LessonReadingContext.Provider>
  )
}
