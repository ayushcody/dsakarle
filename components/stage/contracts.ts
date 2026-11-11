/**
 * Prop contracts between the scene layouts, the Stage UI and the lesson page.
 * Opus owns this file; the three agents building those pieces code against it.
 */
import type { Callout, StageTrack } from '@/types/learning';
import type { Lang, Scene, TracerId } from '@/lib/engine/types';

/** A place in a scene the learner can click when answering a `cell` predict. */
export type PickTarget = string | number

/** components/stage/scenes/SceneRenderer.tsx */
export interface SceneRendererProps {
  scene: Scene
  /** When set, clickable targets (cells by index, nodes by id, buckets by index) call this. */
  onPick?: (target: PickTarget) => void
  /** Highlight pickable targets on hover/focus (used while a `cell` predict is asking). */
  pickable?: boolean
  /** Compact sizing for the home hero and small cards. */
  density?: 'comfortable' | 'compact'
  className?: string
  /** Accessible description of the current state, e.g. the frame's `say`. */
  ariaLabel?: string
}

/** components/stage/scenes/ScenePicture.tsx — the static "Picture" with handwritten callouts. */
export interface ScenePictureProps {
  scene: Scene
  callouts: Callout[]
  className?: string
}

/** Server-rendered code for one CodeRef (see lib/code/render.ts `RenderedCode`). */
export interface RenderedCodeProp {
  langs: Record<Lang, { html: string; anchors: Record<string, number[]>; lineCount: number }>
}

/** components/stage/Stage.tsx — the interactive walkthrough + playground. */
export interface StageProps {
  tracks: StageTrack[]
  /** Show the "Your input" mode. */
  playground: boolean
  /** `lesson` = full stage; `hero` = home-page demo (compact, one track, predict on, no playground). */
  variant?: 'lesson' | 'hero'
  /** Optional code for the active track's tracer, shown in a collapsible "Show code" drawer under the stage. */
  code?: Partial<Record<TracerId, RenderedCodeProp>>
  /** Called once the guided run of any track reaches its last frame (for lesson progress). */
  onGuidedFinish?: () => void
  className?: string
}

/** components/stage/CodePanel.tsx — Python / Java / C++ tabs with a synced mini replay. */
export interface CodePanelProps {
  tracer: TracerId
  code: RenderedCodeProp
  /** Preset index to replay. Defaults to 0. */
  preset?: number
  className?: string
}
