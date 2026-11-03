"use client";

/**
 * CallTree scene — layout, renderer, note targets and screen-reader summary.
 * PLACEHOLDER: replaced by the scene agent that owns this file. The exported
 * names and signatures are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on — keep them.
 */
import type { CallTreeScene as CallTreeSceneData } from "@/lib/engine/types";
import { SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";

export interface CallTreeLayout {
  kind: "call-tree";
  width: number;
  height: number;
}

export function layoutCallTree(scene: CallTreeSceneData, density: Density = "comfortable"): CallTreeLayout {
  void scene;
  return { kind: "call-tree", width: density === "compact" ? 560 : 680, height: 120 };
}

export function resolveCallTreeTarget(scene: CallTreeSceneData, layout: CallTreeLayout, target: string): TargetInfo | null {
  void scene;
  void layout;
  void target;
  return null;
}

export function describeCallTree(scene: CallTreeSceneData): string {
  return `CallTree scene: ${JSON.stringify(scene).slice(0, 200)}`;
}

export function CallTreeSceneView({ scene, density = "comfortable", className, ariaLabel, notes, minNoteRows }: SceneKindProps<CallTreeSceneData>) {
  const layout = layoutCallTree(scene, density);
  const plan = planNotes(scene, layout, [...(scene.annotations ?? []), ...(notes ?? [])], density, { minTopRows: minNoteRows });
  return (
    <SceneFrame width={layout.width} height={layout.height} plan={plan} ariaLabel={ariaLabel} summary={describeCallTree(scene)} interactive={false} className={className}>
      <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" style={{ fill: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        {describeCallTree(scene).slice(0, 80)}
      </text>
    </SceneFrame>
  );
}
