"use client";

import type { ScenePictureProps } from "@/components/stage/contracts";
import { SceneView } from "./SceneRenderer";

/**
 * The static "Picture": the scene at comfortable size with its handwritten
 * callouts. Callouts alternate above and below the scene (pointer and window
 * callouts pick their natural side) and shift to a new row rather than overlap.
 */
export function ScenePicture({ scene, callouts, className }: ScenePictureProps) {
  return (
    <SceneView
      scene={scene}
      density="comfortable"
      notes={callouts}
      minNoteRows={0}
      className={className}
    />
  );
}
