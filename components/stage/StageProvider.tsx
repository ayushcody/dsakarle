'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { useStore } from 'zustand'

import { createStageStore } from '@/lib/engine/store'
import type { StageActions, StageMode, StageStore, StageStoreApi } from '@/lib/engine/store'
import type { Frame } from '@/lib/engine/types'
import { STEP_MS } from '@/lib/motion'

const StageContext = createContext<StageStoreApi | null>(null)

interface StageProviderProps {
  frames: Frame[]
  mode: StageMode
  /** Frame indices to ask predict prompts on (see selectPredicts). Guided mode only by default. */
  predictAt?: Iterable<number>
  /** Start playing on load. Ignored when the OS asks for reduced motion. */
  autoPlay?: boolean
  children: ReactNode
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** One store per provider: every stage on a page is independent. */
export function StageProvider({ frames, mode, predictAt, autoPlay = false, children }: StageProviderProps) {
  const storeRef = useRef<StageStoreApi | null>(null)
  if (!storeRef.current) {
    storeRef.current = createStageStore({ frames, mode, predictAt })
  }
  const store = storeRef.current

  // Reload when the frames (or mode) change; skip the initial mount, where the
  // store was already created with them. predictAt is read from a ref so an
  // inline Set does not trigger reloads.
  const predictAtRef = useRef(predictAt)
  predictAtRef.current = predictAt
  const loadedRef = useRef<{ frames: Frame[]; mode: StageMode } | null>({ frames, mode })
  useEffect(() => {
    const prev = loadedRef.current
    if (!prev || prev.frames !== frames || prev.mode !== mode) {
      store.getState().load(frames, { mode, predictAt: predictAtRef.current })
      loadedRef.current = { frames, mode }
    }
    if (autoPlay && !prefersReducedMotion()) store.getState().play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, frames, mode])

  // Autoplay: tick next() while playing and no prompt is open.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const sync = () => {
      const s = store.getState()
      const open = s.prompt !== null && (s.prompt.status === 'asking' || s.prompt.status === 'hint')
      const want = s.playing && !open
      if (timer && !want) {
        clearInterval(timer)
        timer = null
      }
      if (!timer && want) {
        timer = setInterval(() => store.getState().next(), STEP_MS / s.speed)
      }
    }
    let lastSpeed = store.getState().speed
    const unsubscribe = store.subscribe((s) => {
      if (s.speed !== lastSpeed) {
        lastSpeed = s.speed
        if (timer) {
          clearInterval(timer)
          timer = null
        }
      }
      sync()
    })
    sync()
    return () => {
      unsubscribe()
      if (timer) clearInterval(timer)
    }
  }, [store])

  return <StageContext.Provider value={store}>{children}</StageContext.Provider>
}

/** The raw per-stage store (for advanced use / getState in handlers). */
export function useStageStore(): StageStoreApi {
  const store = useContext(StageContext)
  if (!store) throw new Error('useStage / useStageApi must be used inside a <StageProvider>.')
  return store
}

/** Subscribe to a slice of this stage's state. */
export function useStage<T>(selector: (s: StageStore) => T): T {
  return useStore(useStageStore(), selector)
}

const ACTION_KEYS: Array<keyof StageActions> = [
  'load', 'next', 'prev', 'seek', 'first', 'last', 'play', 'pause', 'toggle',
  'setSpeed', 'setPredictEnabled', 'answer', 'continueAfterPrompt', 'skipPrompt',
]

/** Stable action functions for this stage (never changes identity, never re-renders). */
export function useStageApi(): StageActions {
  const store = useStageStore()
  return useMemo(() => {
    const out = {} as Record<string, unknown>
    for (const k of ACTION_KEYS) out[k] = (...args: unknown[]) => (store.getState()[k] as (...a: unknown[]) => void)(...args)
    return out as unknown as StageActions
  }, [store])
}

const INTERACTIVE = 'button, a, summary, [role="button"], [role="tab"], [role="radio"], [role="switch"], [role="checkbox"]'
const OWNS_ARROWS = '[role="radiogroup"], [role="tablist"], [role="slider"], [role="listbox"], [role="menu"], [role="tree"], [role="grid"]'

/**
 * Keyboard control for a stage element: ArrowRight/Left = next/prev,
 * Space = play/pause, Home/End = first/last. Active when focus is on or inside
 * `ref`. Ignores typing fields, modified keys, and widgets that own the key.
 */
export function useStageKeyboard(ref: RefObject<HTMLElement>): void {
  const api = useStageApi()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t) {
        if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
        if (e.key === ' ' && t.closest(INTERACTIVE)) return
        if (e.key !== ' ' && t.closest(OWNS_ARROWS)) return
      }
      switch (e.key) {
        case 'ArrowRight': api.next(); break
        case 'ArrowLeft': api.prev(); break
        case ' ': case 'Spacebar': api.toggle(); break
        case 'Home': api.first(); break
        case 'End': api.last(); break
        default: return
      }
      e.preventDefault()
    }
    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [ref, api])
}
