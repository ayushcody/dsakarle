'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'

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
import type { LegendRole } from './primitives'
import { SceneRenderer } from './scenes/SceneRenderer'
import type { PickTarget, RenderedCodeProp } from './contracts'

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
  const onPick = pickable ? (t: PickTarget) => api.answer(t) : undefined

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="group"
      aria-label="Interactive walkthrough. Left and right arrows step, space plays or pauses."
      className={cn('flex flex-col gap-4 rounded-card outline-none', focusRing, 'focus-visible:outline-offset-8', className)}
    >
      {header}

      <div className={cn('grid gap-5', !hero && 'lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-8')}>
        <div className="flex min-w-0 flex-col gap-4">
          {playgroundSlot}

          <div className="graph-paper flex items-center justify-center overflow-hidden rounded-card border border-rule p-3 shadow-1 sm:p-5">
            {frame ? (
              <SceneRenderer
                scene={frame.scene}
                onPick={onPick}
                pickable={pickable}
                density={hero ? 'compact' : 'comfortable'}
                ariaLabel={frame.say}
                className="w-full"
              />
            ) : null}
          </div>

          <Narration scopeRef={rootRef} compact={hero} />
          <FinishNudge canTryOwn={canTryOwn} onTryOwn={() => onTryOwn?.()} onFinish={onFinish} quiet={hero} />
          <Controls compact={hero} />
        </div>

        {hero ? null : (
          <div className="flex min-w-0 flex-col gap-5">
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
      </div>

      {!hero && code ? (
        <Disclosure title="Show the code">
          <SyncedCode code={code} compact />
        </Disclosure>
      ) : null}
    </div>
  )
}
