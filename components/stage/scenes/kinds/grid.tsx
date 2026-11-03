"use client";

/**
 * Grid scene — layout, renderer, note targets and screen-reader summary.
 * PLACEHOLDER: replaced by the scene agent that owns this file. The exported
 * names and signatures are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on — keep them.
 */
import type { GridScene as GridSceneData } from "@/lib/engine/types";
import { SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";

export interface GridLayout {
  kind: "grid";
  width: number;
  height: number;
}

export function layoutGrid(scene: GridSceneData, density: Density = "comfortable"): GridLayout {
  void scene;
  return { kind: "grid", width: density === "compact" ? 560 : 680, height: 120 };
}

export function resolveGridTarget(scene: GridSceneData, layout: GridLayout, target: string): TargetInfo | null {
  void scene;
  void layout;
  void target;
  return null;
}

export function describeGrid(scene: GridSceneData): string {
  return `Grid scene: ${JSON.stringify(scene).slice(0, 200)}`;
}

export function GridSceneView({ scene, density = "comfortable", className, ariaLabel, notes, minNoteRows }: SceneKindProps<GridSceneData>) {
  const layout = layoutGrid(scene, density);
  const plan = planNotes(scene, layout, [...(scene.annotations ?? []), ...(notes ?? [])], density, { minTopRows: minNoteRows });
  return (
    <SceneFrame width={layout.width} height={layout.height} plan={plan} ariaLabel={ariaLabel} summary={describeGrid(scene)} interactive={false} className={className}>
      <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" style={{ fill: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        {describeGrid(scene).slice(0, 80)}
      </text>
    </SceneFrame>
  );
}
