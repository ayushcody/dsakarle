"use client";

/**
 * Stack scene — layout, renderer, note targets and screen-reader summary.
 * PLACEHOLDER: replaced by the scene agent that owns this file. The exported
 * names and signatures are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on — keep them.
 */
import type { StackScene as StackSceneData } from "@/lib/engine/types";
import { SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";

export interface StackLayout {
  kind: "stack";
  width: number;
  height: number;
}

export function layoutStack(scene: StackSceneData, density: Density = "comfortable"): StackLayout {
  void scene;
  return { kind: "stack", width: density === "compact" ? 560 : 680, height: 120 };
}

export function resolveStackTarget(scene: StackSceneData, layout: StackLayout, target: string): TargetInfo | null {
  void scene;
  void layout;
  void target;
  return null;
}

export function describeStack(scene: StackSceneData): string {
  return `Stack scene: ${JSON.stringify(scene).slice(0, 200)}`;
}

export function StackSceneView({ scene, density = "comfortable", className, ariaLabel, notes, minNoteRows }: SceneKindProps<StackSceneData>) {
  const layout = layoutStack(scene, density);
  const plan = planNotes(scene, layout, [...(scene.annotations ?? []), ...(notes ?? [])], density, { minTopRows: minNoteRows });
  return (
    <SceneFrame width={layout.width} height={layout.height} plan={plan} ariaLabel={ariaLabel} summary={describeStack(scene)} interactive={false} className={className}>
      <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" style={{ fill: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        {describeStack(scene).slice(0, 80)}
      </text>
    </SceneFrame>
  );
}
