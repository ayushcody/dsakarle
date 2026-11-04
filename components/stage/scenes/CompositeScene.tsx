"use client";

import type { ReactNode } from "react";
import type {
  Annotation,
  CompositeScene as CompositeData,
  Scene,
} from "@/lib/engine/types";
import { SURFACE } from "@/lib/stage/semantics";
import { assignNotesToParts, type Density } from "./layout";

export interface CompositeSceneProps {
  scene: CompositeData;
  density?: Density;
  ariaLabel?: string;
  className?: string;
  /** Extra notes (picture callouts), handed to the part that owns each target. */
  notes?: Annotation[];
  /** Draws one part. Injected by SceneRenderer so this file never imports it back. */
  renderPart: (scene: Exclude<Scene, CompositeData>, notes: Annotation[], index: number) => ReactNode;
}

/**
 * Parts as separate scenes in a flex row or column. A row wraps to a column on
 * narrow screens (each part keeps at least 280px before it wraps).
 */
export function CompositeScene({
  scene,
  density = "comfortable",
  ariaLabel,
  className,
  notes,
  renderPart,
}: CompositeSceneProps) {
  const assigned = assignNotesToParts(scene.parts, notes ?? [], density);
  const row = scene.layout === "row";
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        flexDirection: row ? "row" : "column",
        flexWrap: row ? "wrap" : "nowrap",
        gap: density === "compact" ? 12 : 20,
        alignItems: row ? "flex-start" : "stretch",
      }}
    >
      {scene.parts.map((part, i) => (
        <figure
          key={i}
          style={{ margin: 0, flex: row ? "1 1 280px" : "0 0 auto", minWidth: 0 }}
        >
          {part.title && (
            <figcaption
              className="t-caption"
              style={{ color: SURFACE.ink2, marginBottom: 6 }}
            >
              {part.title}
            </figcaption>
          )}
          {renderPart(part.scene, assigned[i], i)}
        </figure>
      ))}
    </div>
  );
}
