"use client";

import type { Annotation } from "@/lib/engine/types";
import type { SceneRendererProps } from "@/components/stage/contracts";
import { ArrayScene } from "./ArrayScene";
import { CompositeScene } from "./CompositeScene";
import { HashMapScene } from "./HashMapScene";
import { LinkedListScene } from "./LinkedListScene";
import { TreeSceneView } from "./kinds/tree";
import { GraphSceneView } from "./kinds/graph";
import { CallTreeSceneView } from "./kinds/call-tree";
import { StackSceneView } from "./kinds/stack";
import { GridSceneView } from "./kinds/grid";

/** SceneRenderer plus the two knobs ScenePicture needs (not part of the public contract). */
export interface SceneViewProps extends SceneRendererProps {
  notes?: Annotation[];
  minNoteRows?: number;
}

export function SceneView({
  scene,
  onPick,
  pickable = false,
  density = "comfortable",
  className,
  ariaLabel,
  notes,
  minNoteRows,
}: SceneViewProps) {
  // Keep the height steady between frames: one row of note space in comfortable mode.
  const rows = minNoteRows ?? (density === "comfortable" ? 1 : 0);
  const common = { density, pickable, onPick, className, ariaLabel, notes, minNoteRows: rows };

  switch (scene.kind) {
    case "array":
      return <ArrayScene scene={scene} {...common} />;
    case "linked-list":
      return <LinkedListScene scene={scene} {...common} />;
    case "hash-map":
      return <HashMapScene scene={scene} {...common} />;
    case "tree":
      return <TreeSceneView scene={scene} {...common} />;
    case "graph":
      return <GraphSceneView scene={scene} {...common} />;
    case "call-tree":
      return <CallTreeSceneView scene={scene} {...common} />;
    case "stack":
      return <StackSceneView scene={scene} {...common} />;
    case "grid":
      return <GridSceneView scene={scene} {...common} />;

    case "composite":
      return (
        <CompositeScene
          scene={scene}
          density={density}
          className={className}
          ariaLabel={ariaLabel}
          notes={notes}
          renderPart={(part, partNotes, i) => (
            <SceneView
              scene={part}
              density={density}
              // A `cell` predict is answered in the first part (the grid, tree, graph or list);
              // the queue / stack / table beside it is context, not a target.
              pickable={pickable && i === 0}
              onPick={pickable && i === 0 ? onPick : undefined}
              notes={partNotes}
              minNoteRows={minNoteRows}
            />
          )}
        />
      );
  }
}

/** Draws one frame's scene. Switches on `scene.kind`; every kind renders one responsive svg. */
export function SceneRenderer(props: SceneRendererProps) {
  return <SceneView {...props} />;
}
