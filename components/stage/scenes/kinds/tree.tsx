"use client";

/**
 * Tree scene — layout, renderer, note targets and screen-reader summary.
 * PLACEHOLDER: replaced by the scene agent that owns this file. The exported
 * names and signatures are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on — keep them.
 */
import type { TreeScene as TreeSceneData } from "@/lib/engine/types";
import { SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";

export interface TreeLayout {
  kind: "tree";
  width: number;
  height: number;
}

export function layoutTree(scene: TreeSceneData, density: Density = "comfortable"): TreeLayout {
  void scene;
  return { kind: "tree", width: density === "compact" ? 560 : 680, height: 120 };
}

export function resolveTreeTarget(scene: TreeSceneData, layout: TreeLayout, target: string): TargetInfo | null {
  void scene;
  void layout;
  void target;
  return null;
}

export function describeTree(scene: TreeSceneData): string {
  return `Tree scene: ${JSON.stringify(scene).slice(0, 200)}`;
}

export function TreeSceneView({ scene, density = "comfortable", className, ariaLabel, notes, minNoteRows }: SceneKindProps<TreeSceneData>) {
  const layout = layoutTree(scene, density);
  const plan = planNotes(scene, layout, [...(scene.annotations ?? []), ...(notes ?? [])], density, { minTopRows: minNoteRows });
  return (
    <SceneFrame width={layout.width} height={layout.height} plan={plan} ariaLabel={ariaLabel} summary={describeTree(scene)} interactive={false} className={className}>
      <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" style={{ fill: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        {describeTree(scene).slice(0, 80)}
      </text>
    </SceneFrame>
  );
}
