"use client";

/**
 * Graph scene — layout, renderer, note targets and screen-reader summary.
 * PLACEHOLDER: replaced by the scene agent that owns this file. The exported
 * names and signatures are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on — keep them.
 */
import type { GraphScene as GraphSceneData } from "@/lib/engine/types";
import { SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";

export interface GraphLayout {
  kind: "graph";
  width: number;
  height: number;
}

export function layoutGraph(scene: GraphSceneData, density: Density = "comfortable"): GraphLayout {
  void scene;
  return { kind: "graph", width: density === "compact" ? 560 : 680, height: 120 };
}

export function resolveGraphTarget(scene: GraphSceneData, layout: GraphLayout, target: string): TargetInfo | null {
  void scene;
  void layout;
  void target;
  return null;
}

export function describeGraph(scene: GraphSceneData): string {
  return `Graph scene: ${JSON.stringify(scene).slice(0, 200)}`;
}

export function GraphSceneView({ scene, density = "comfortable", className, ariaLabel, notes, minNoteRows }: SceneKindProps<GraphSceneData>) {
  const layout = layoutGraph(scene, density);
  const plan = planNotes(scene, layout, [...(scene.annotations ?? []), ...(notes ?? [])], density, { minTopRows: minNoteRows });
  return (
    <SceneFrame width={layout.width} height={layout.height} plan={plan} ariaLabel={ariaLabel} summary={describeGraph(scene)} interactive={false} className={className}>
      <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" style={{ fill: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        {describeGraph(scene).slice(0, 80)}
      </text>
    </SceneFrame>
  );
}
