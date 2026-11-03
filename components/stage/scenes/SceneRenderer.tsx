"use client";

import type { Annotation } from "@/lib/engine/types";
import type { SceneRendererProps } from "@/components/stage/contracts";
import { ArrayScene } from "./ArrayScene";
import { CompositeScene } from "./CompositeScene";
import { HashMapScene } from "./HashMapScene";
import { LinkedListScene } from "./LinkedListScene";

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
    case "composite":
      return (
        <CompositeScene
          scene={scene}
          density={density}
          className={className}
          ariaLabel={ariaLabel}
          notes={notes}
          renderPart={(part, partNotes) => (
            <SceneView
              scene={part}
              density={density}
              pickable={pickable}
              onPick={onPick}
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
