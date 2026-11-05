"use client";

import { SURFACE } from "@/lib/stage/semantics";
import { useStageScope } from "./ids";

export interface GraphPaperProps {
  width: number;
  height: number;
  x?: number;
  y?: number;
  /** Grid pitch in px. Default 24. */
  size?: number;
  /** Corner radius of the paper. Default 10 (--r-card). */
  rx?: number;
  idPrefix?: string;
}

/** Cream background with a 24px grid, drawn behind everything else in the stage svg. */
export function GraphPaper({
  width,
  height,
  x = 0,
  y = 0,
  size = 24,
  rx = 10,
  idPrefix,
}: GraphPaperProps) {
  const ids = useStageScope(idPrefix);
  return (
    <g aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern
          id={ids.grid}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${size} 0H0V${size}`}
            fill="none"
            strokeWidth={1}
            shapeRendering="crispEdges"
            style={{ stroke: SURFACE.grid }}
          />
        </pattern>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        style={{ fill: SURFACE.raised }}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        fill={ids.gridUrl}
      />
    </g>
  );
}
