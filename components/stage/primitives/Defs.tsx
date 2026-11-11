"use client";

import { ARROW_ROLES, HATCH_STROKE, arrowVisual } from "@/lib/stage/semantics";
import { useStageScope } from "./ids";

/** The pencil-hatch pattern. Exported so the HTML Legend can reuse it in its own swatches. */
export function HatchPattern({ id }: { id: string }) {
  return (
    <pattern
      id={id}
      width={6}
      height={6}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={6}
        style={{ stroke: HATCH_STROKE }}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </pattern>
  );
}

/**
 * Shared <defs>: hatch pattern and one open arrowhead marker per role.
 * Render once per stage svg. Ids come from the surrounding StageIdsProvider
 * (or `idPrefix`), so two stages on one page never collide.
 */
export function Defs({ idPrefix }: { idPrefix?: string }) {
  const ids = useStageScope(idPrefix);
  return (
    <defs>
      <HatchPattern id={ids.hatch} />
      {ARROW_ROLES.map((role) => (
        <marker
          key={role}
          id={ids.marker(role)}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
        >
          <path
            d="M1.5 1.5 L8.5 5 L1.5 8.5"
            fill="none"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: arrowVisual(role).stroke }}
          />
        </marker>
      ))}
    </defs>
  );
}
