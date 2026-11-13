'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState } from 'react'

import { Glyph } from '@/components/glyph'
import { Button, Chip, cn, focusRing } from '@/components/ui'
import type { GlyphId } from '@/types/learning'

export interface GalleryEntry {
  href: string
  label: string
  lessonTitle: string
}

export interface GalleryLesson {
  slug: string
  title: string
  glyph: GlyphId
  entries: GalleryEntry[]
}

export interface GalleryGroup {
  pathId: string
  pathTitle: string
  lessons: GalleryLesson[]
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-coral-ink" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

/** Searchable, path-filterable list of every walkthrough on the site. */
export function VisualGallery({ groups }: { groups: GalleryGroup[] }) {
  const router = useRouter()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [path, setPath] = useState<string | null>(null)

  const all = useMemo(() => groups.flatMap((g) => g.lessons.flatMap((l) => l.entries)), [groups])

  const visible = useMemo(() => {
    const q = normalise(query)
    const words = q ? q.split(' ') : []
    return groups
      .filter((g) => !path || g.pathId === path)
      .map((g) => ({
        ...g,
        lessons: g.lessons
          .map((l) => ({
            ...l,
            entries: l.entries.filter((e) => {
              if (words.length === 0) return true
              const hay = normalise(`${e.label} ${l.title} ${g.pathTitle}`)
              return words.every((w) => hay.includes(w))
            }),
          }))
          .filter((l) => l.entries.length > 0),
      }))
      .filter((g) => g.lessons.length > 0)
  }, [groups, path, query])

  const shown = visible.reduce((n, g) => n + g.lessons.reduce((m, l) => m + l.entries.length, 0), 0)

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-card border border-rule bg-paper-raised p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor={searchId} className="block text-[14px] font-semibold text-ink">
              Find an algorithm
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “heap”, “shortest path” or “window”"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'mt-1.5 h-11 w-full rounded-cell border border-rule bg-paper-sunken px-3 text-[15px] text-ink placeholder:text-ink-3 hover:border-rule-strong',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              )}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              const pick = all[Math.floor(Math.random() * all.length)]
              if (pick) router.push(pick.href)
            }}
          >
            Surprise me
          </Button>
        </div>
        <div role="group" aria-label="Filter by path" className="flex flex-wrap gap-2">
          <Chip selectable selected={path === null} onClick={() => setPath(null)} className="px-3">
            All paths
          </Chip>
          {groups.map((g) => (
            <Chip key={g.pathId} selectable selected={path === g.pathId} onClick={() => setPath(path === g.pathId ? null : g.pathId)} className="px-3">
              {g.pathTitle}
            </Chip>
          ))}
        </div>
      </div>

      <p role="status" className="mt-4 text-[14px] text-ink-3">
        {shown === all.length ? `${all.length} visualizations` : `${shown} of ${all.length} visualizations`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-rule-strong p-8 text-center">
          <p className="text-[16px] text-ink-2">Nothing matches “{query}”.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setQuery(''); setPath(null) }}>
            Clear the search
          </Button>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-12">
        {visible.map((g) => (
          <section key={g.pathId} aria-labelledby={`vz-${g.pathId}`}>
            <h2 id={`vz-${g.pathId}`} className="t-h2 text-ink">
              {g.pathTitle}
            </h2>
            <div className="mt-5 flex flex-col gap-6">
              {g.lessons.map((l) => (
                <div key={l.slug}>
                  <div className="flex items-center justify-between gap-3 border-b border-rule pb-2">
                    <h3 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                      <Glyph id={l.glyph} size={24} decorative />
                      {l.title}
                    </h3>
                    <Link
                      href={`/learn/${l.slug}`}
                      className={cn('inline-flex min-h-10 items-center rounded-cell px-1 text-[14px] font-semibold text-coral-ink underline-offset-4 hover:underline', focusRing)}
                    >
                      Lesson<span className="sr-only">: {l.title}</span>
                    </Link>
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {l.entries.map((e) => (
                      <li key={e.href}>
                        <Link
                          href={e.href}
                          className={cn(
                            'group flex min-h-[56px] items-center gap-3 rounded-card border border-rule bg-paper-raised px-4 py-3 text-[15px] font-medium leading-6 text-ink hover:border-rule-strong hover:bg-paper-sunken',
                            focusRing,
                          )}
                        >
                          <span className="min-w-0 flex-1">{e.label}</span>
                          <Arrow />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
