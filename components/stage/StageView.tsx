'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { Disclosure, cn, focusRing } from '@/components/ui'
import type { AnyTracer, Frame, Scene } from '@/lib/engine/types'

import { Controls } from './Controls'
import { FinishNudge } from './FinishNudge'
import { GaugeBar } from './GaugeBar'
import { Narration } from './Narration'
import { RuleRail } from './RuleRail'
import { SyncedCode } from './CodePanel'
import { useStage, useStageApi, useStageKeyboard } from './StageProvider'
import { VarsPanel } from './VarsPanel'
import { Legend } from './primitives'
import { ScrollRegion } from './primitives/ScrollRegion'
import type { LegendRole } from './primitives'
import { SceneRenderer } from './scenes/SceneRenderer'
import type { PickTarget, RenderedCodeProp } from './contracts'
import { STAGE_BUCKETS, sceneHeightBuckets } from './scenes/reserve'
import styles from './stage.module.css'
import type { Density } from './scenes/layout'

const LEGEND_ORDER: LegendRole[] = ['ptrA', 'ptrB', 'focus', 'window', 'compare', 'changed', 'visited', 'discarded', 'found', 'error']

/** Every semantic role a scene uses (composites included). */
function sceneRoles(scene: Scene, into: Set<LegendRole>): void {
  switch (scene.kind) {
    case 'array':
      scene.pointers?.forEach((p) => into.add(p.role))
      scene.marks?.forEach((m) => into.add(m.role))
      if (scene.window) into.add('window')
      break
    case 'linked-list':
      scene.pointers?.forEach((p) => into.add(p.role))
      scene.marks?.forEach((m) => into.add(m.role))
      scene.links.forEach((l) => l.role && into.add(l.role))
      break
    case 'hash-map':
      scene.marks?.forEach((m) => into.add(m.role))
      break
    case 'composite':
      scene.parts.forEach((p) => sceneRoles(p.scene, into))
      break
    default:
      break
  }
}

/** Roles across the whole run, in a fixed order, so the legend does not jump around while stepping. */
function runRoles(frames: Frame[]): LegendRole[] {
  const seen = new Set<LegendRole>()
  for (const f of frames) sceneRoles(f.scene, seen)
  return LEGEND_ORDER.filter((r) => seen.has(r))
}

/**
 * The fixed-height scene box. The box height comes from CSS (computed from the
 * pure layout, see scenes/reserve.ts); if a frame is taller than the box (the
 * box is capped) the scene is scaled down to fit, measured once per frame before
 * paint. Nothing here renders hidden copies of the svg.
 */
function SceneBox({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const box = boxRef.current
    const fit = fitRef.current
    if (!box || !fit) return
    const apply = () => {
      const room = box.clientHeight - 32
      const need = fit.offsetHeight
      const k = need > 0 && room > 0 ? Math.min(1, room / need) : 1
      fit.style.setProperty('--fit', String(Math.round(k * 1000) / 1000))
    }
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(box)
    ro.observe(fit)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={boxRef} className={styles.sceneBox}>
      <div ref={fitRef} className={styles.sceneFit}>
        {children}
      </div>
    </div>
  )
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface StageViewProps {
  tracer: AnyTracer
  variant?: 'lesson' | 'hero'
  /** Track picker / mode switch / predict toggle row. Rendered inside the stage so it can read the store. */
  header?: ReactNode
  /** The "Your input" card, shown above the scene. */
  playgroundSlot?: ReactNode
  /** Rendered code for the active tracer: enables the "Show the code" drawer. */
  code?: RenderedCodeProp
  canTryOwn?: boolean
  onTryOwn?: () => void
  onFinish?: () => void
  className?: string
}

/**
 * The stage layout. Desktop: scene, narration and controls on the left, the Rule
 * Rail, variables, gauge and legend on the right. Narrow: one column in the order
 * scene, narration, controls, rules, variables. Must sit inside a StageProvider.
 */
export function StageView({
  tracer,
  variant = 'lesson',
  header,
  playgroundSlot,
  code,
  canTryOwn = false,
  onTryOwn,
  onFinish,
  className,
}: StageViewProps) {
  const hero = variant === 'hero'
  const rootRef = useRef<HTMLDivElement>(null)
  useStageKeyboard(rootRef)
  const api = useStageApi()

  const frames = useStage((s) => s.frames)
  const frame = useStage((s) => s.frames[s.index])
  const asking = useStage((s) => {
    const p = s.prompt
    return p !== null && (p.status === 'asking' || p.status === 'hint')
  })
  const pickKind = useStage((s) => (s.prompt ? s.frames[s.prompt.frameIndex]?.predict?.kind : undefined))
  const pickable = asking && pickKind === 'cell'

  const roles = useMemo(() => runRoles(frames), [frames])
  const density: Density = hero ? 'compact' : 'comfortable'
  const heights = useMemo(() => sceneHeightBuckets(frames, density, density === 'comfortable' ? 1 : 0, !hero), [frames, density, hero])
  const vars = useMemo(() => {
    const o: Record<string, string> = {}
    STAGE_BUCKETS.forEach((_, i) => {
      o[`--sh${i}`] = `${heights[i]}px`
    })
    return o as CSSProperties
  }, [heights])
  const onPick = pickable ? (t: PickTarget) => api.answer(t) : undefined

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="group"
      aria-label="Interactive walkthrough. Left and right arrows step, space plays or pauses."
      style={vars}
      className={cn(
        styles.root,
        'flex flex-col gap-4 rounded-card border border-rule bg-paper-raised p-4 outline-none',
        focusRing,
        'focus-visible:outline-offset-4',
        className,
      )}
    >
      {header}
      {playgroundSlot}

      <div className={cn(styles.body, hero ? styles.hero : styles.split)}>
        <SceneBox>
          {frame ? (
            <SceneRenderer
              scene={frame.scene}
              onPick={onPick}
              pickable={pickable}
              density={density}
              ariaLabel={frame.say}
              className="w-full"
            />
          ) : null}
        </SceneBox>

        <div className={styles.sideOuter}>
          <ScrollRegion label="Narration and rules, scrollable" axis="y" className={styles.sideScroll}>
            <Narration scopeRef={rootRef} compact={hero} className={styles.narration} />
            <FinishNudge
              canTryOwn={canTryOwn}
              onTryOwn={() => onTryOwn?.()}
              onFinish={onFinish}
              quiet={hero}
              className={styles.nudge}
            />
            {hero ? null : (
              <div className={cn(styles.rules, 'flex min-w-0 flex-col gap-5')}>
                <RuleRail anchors={tracer.anchors} />
                <VarsPanel vars={tracer.vars} />
                <GaugeBar />
                {roles.length > 0 ? (
                  <section aria-label="Key to the marks">
                    <h3 className="t-eyebrow mb-2">What the marks mean</h3>
                    <Legend roles={roles} />
                  </section>
                ) : null}
              </div>
            )}
          </ScrollRegion>
        </div>

        <Controls compact={hero} className={styles.controls} />
      </div>

      {!hero && code ? (
        <Disclosure title="Show the code">
          <SyncedCode code={code} compact />
        </Disclosure>
      ) : null}
    </div>
  )
}
