'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

import { Button, SegmentedControl, cn, focusRing } from '@/components/ui'
import { LANGS } from '@/lib/engine/types'
import type { Frame, Lang } from '@/lib/engine/types'
import { loadTracer } from '@/lib/tracers'

import type { CodePanelProps, RenderedCodeProp } from './contracts'
import styles from './code.module.css'
import { StageProvider, useStage, useStageApi, useStageKeyboard } from './StageProvider'

// ---------------------------------------------------------------------------
// Remembered language (shared by every code view on the page)
// ---------------------------------------------------------------------------

const LANG_KEY = 'dsakarle-lang'
const LANG_EVENT = 'dsakarle-lang-change'
const LANG_LABEL: Record<Lang, string> = { python: 'Python', java: 'Java', cpp: 'C++' }
const LANG_OPTIONS = LANGS.map((l) => ({ value: l, label: LANG_LABEL[l] }))

function readLang(): Lang {
  try {
    const v = window.localStorage.getItem(LANG_KEY)
    if (v === 'python' || v === 'java' || v === 'cpp') return v
  } catch {
    /* storage can be blocked */
  }
  return 'python'
}

function subscribeLang(cb: () => void): () => void {
  window.addEventListener('storage', cb)
  window.addEventListener(LANG_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(LANG_EVENT, cb)
  }
}

/** The learner's language, remembered across lessons and in sync across panels. */
function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => 'python' as Lang)
  const setLang = useCallback((l: Lang) => {
    try {
      window.localStorage.setItem(LANG_KEY, l)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(LANG_EVENT))
  }, [])
  return [lang, setLang]
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// SyncedCode — language tabs + highlighted code that follows the enclosing store
// ---------------------------------------------------------------------------

export interface SyncedCodeProps {
  code: RenderedCodeProp
  /** Rendered between the tab row and the code (used by CodePanel for its mini replay). */
  aboveCode?: ReactNode
  compact?: boolean
  className?: string
}

/** Must be rendered inside a StageProvider. Lines of the active rule get `is-active`. */
export function SyncedCode({ code, aboveCode, compact = false, className }: SyncedCodeProps) {
  const [lang, setLang] = useLang()
  const at = useStage((s) => s.frames[s.index]?.at)
  const data = code.langs[lang]
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Mark the active rule's lines and keep them in view (scrolls only the code box).
  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return
    const active = new Set<number>(at ? data?.anchors[at] ?? [] : [])
    let first: HTMLElement | null = null
    root.querySelectorAll<HTMLElement>('[data-line]').forEach((el) => {
      const n = Number(el.dataset.line)
      const on = active.has(n) || (!!at && el.dataset.anchor === at)
      el.classList.toggle('is-active', on)
      if (on && !first) first = el
    })
    if (!first) return
    const line: HTMLElement = first
    const top = line.offsetTop
    const bottom = top + line.offsetHeight
    const margin = 32
    if (top < root.scrollTop + margin || bottom > root.scrollTop + root.clientHeight - margin) {
      root.scrollTo({
        top: Math.max(0, top - root.clientHeight / 3),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }, [at, data?.html, data?.anchors])

  const copy = async () => {
    const text = scrollerRef.current?.querySelector('pre')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard may be unavailable; nothing else to do */
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl options={LANG_OPTIONS} value={lang} onChange={setLang} aria-label="Language" />
        <Button variant="ghost" size="sm" onClick={copy} aria-live="polite">
          {copied ? 'Copied ✓' : 'Copy code'}
        </Button>
      </div>
      {aboveCode}
      <div
        ref={scrollerRef}
        className={cn(styles.scroller, compact && styles.compact, focusRing)}
        // The block scrolls, so keyboard users must be able to reach it.
        tabIndex={0}
        role="region"
        aria-label={`${LANG_LABEL[lang]} code`}
        dangerouslySetInnerHTML={{ __html: data?.html ?? '' }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CodePanel — the lesson's "Template & code" block with its own mini replay
// ---------------------------------------------------------------------------

const NO_FRAMES: Frame[] = []

function ArrowIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
    </svg>
  )
}

function MiniReplay() {
  const api = useStageApi()
  const index = useStage((s) => s.index)
  const n = useStage((s) => s.frames.length)
  const say = useStage((s) => s.frames[s.index]?.say ?? '')
  if (n === 0) return <p className="t-small text-ink-3">Getting the replay ready…</p>
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={api.prev} disabled={index === 0} aria-label="Previous step">
          <ArrowIcon dir="left" />
        </Button>
        <input
          type="range"
          min={0}
          max={n - 1}
          step={1}
          value={index}
          onChange={(e) => api.seek(Number(e.target.value))}
          aria-label={`Step ${index + 1} of ${n}`}
          aria-valuetext={`Step ${index + 1} of ${n}`}
          className={cn(styles.range, 'h-10 min-w-0 flex-1 cursor-pointer', focusRing)}
        />
        <Button variant="secondary" size="sm" onClick={api.next} disabled={index >= n - 1} aria-label="Next step">
          <ArrowIcon dir="right" />
        </Button>
        <span className="w-14 shrink-0 text-right font-mono text-[12px] text-ink-3" aria-hidden="true">
          {index + 1} / {n}
        </span>
      </div>
      <p className="min-h-[2.5rem] text-[14px] leading-5 text-ink-2" aria-live="polite">
        {say}
      </p>
    </div>
  )
}

function CodePanelBody({ code, className }: { code: RenderedCodeProp; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useStageKeyboard(ref)
  return (
    <div ref={ref} className={className}>
      <SyncedCode code={code} aboveCode={<MiniReplay />} />
    </div>
  )
}

/** Python / Java / C++ tabs with a replay of the tracer's preset, line-synced to the rules. */
export function CodePanel({ tracer, code, preset = 0, className }: CodePanelProps) {
  const [frames, setFrames] = useState<Frame[]>(NO_FRAMES)

  useEffect(() => {
    let cancelled = false
    loadTracer(tracer)
      .then((t) => {
        if (cancelled) return
        const presets = t.input.presets
        const p = presets[Math.min(Math.max(0, preset), presets.length - 1)]
        setFrames(t.run(p.value).frames)
      })
      .catch(() => {
        /* leave the static code; the replay just stays idle */
      })
    return () => {
      cancelled = true
    }
  }, [tracer, preset])

  return (
    <StageProvider frames={frames} mode="playground">
      <CodePanelBody code={code} className={className} />
    </StageProvider>
  )
}
