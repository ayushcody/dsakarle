"use client";

import { motion } from "framer-motion";
import type { PointerRole } from "@/lib/engine/types";
import { FONT_MONO, POINTER_VISUAL, RING_WIDTH } from "@/lib/stage/semantics";
import { usePositionTransition } from "./motion-utils";

/** Suggested `offset` step when two tags share an x. */
export const TAG_STACK = 22;

const TRI = 8; // triangle height
const GAP = 22; // cell edge -> triangle tip; clears the index label under a cell

export interface PointerTagProps {
  /** Horizontal centre of the cell this tag points at. Spring-animated. */
  x: number;
  /**
   * The cell edge the tag attaches to: the cell's bottom for `ptrA` (tag hangs
   * below, triangle pointing up) and its top for `ptrB` / `focus` (tag sits
   * above, triangle pointing down).
   */
  y: number;
  name: string;
  role: PointerRole;
  /** Extra distance away from the cell, to stack tags that share an x. Use multiples of TAG_STACK. */
  offset?: number;
  /** For `focus`: when given, also draws the ring around the cell (centred on x, top at y). */
  cellW?: number;
  cellH?: number;
}

/**
 * A pointer label. ptrA hangs below its cell with a ▲, ptrB sits above with a
 * ▼, focus is a ringed caption above. The shape and position carry the meaning
 * as well as the colour.
 */
export function PointerTag({
  x,
  y,
  name,
  role,
  offset = 0,
  cellW,
  cellH,
}: PointerTagProps) {
  const transition = usePositionTransition("snappy");
  const vis = POINTER_VISUAL[role];
  const below = role === "ptrA";

  // Local frame: x = 0 is the cell centre, y = 0 is the cell edge.
  let ty: number;
  let content;
  if (below) {
    ty = y + GAP + offset;
    content = (
      <>
        <polygon
          points={`0,0 ${-TRI * 0.75},${TRI} ${TRI * 0.75},${TRI}`}
          style={{ fill: vis.fill }}
        />
        <text
          y={TRI + 13}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          style={{ fill: vis.text, fontFamily: FONT_MONO }}
        >
          {name}
        </text>
      </>
    );
  } else if (role === "ptrB") {
    ty = y - 8 - offset;
    content = (
      <>
        <polygon
          points={`0,0 ${-TRI * 0.75},${-TRI} ${TRI * 0.75},${-TRI}`}
          style={{ fill: vis.fill }}
        />
        <text
          y={-TRI - 5}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          style={{ fill: vis.text, fontFamily: FONT_MONO }}
        >
          {name}
        </text>
      </>
    );
  } else {
    // focus: ringed caption pill above the cell
    ty = y - 8 - offset;
    const pillW = Math.max(28, name.length * 7.4 + 14);
    content = (
      <>
        {cellW !== undefined && cellH !== undefined && (
          <rect
            x={-cellW / 2 - 3}
            y={8 - 3}
            width={cellW + 6}
            height={cellH + 6}
            rx={9}
            fill="none"
            strokeWidth={RING_WIDTH}
            style={{ stroke: vis.stroke }}
          />
        )}
        <rect
          x={-pillW / 2}
          y={-20}
          width={pillW}
          height={18}
          rx={9}
          strokeWidth={RING_WIDTH}
          style={{ fill: vis.fill, stroke: vis.stroke }}
        />
        <text
          y={-11}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          style={{ fill: vis.text, fontFamily: FONT_MONO }}
        >
          {name}
        </text>
      </>
    );
  }

  return (
    <motion.g
      initial={false}
      animate={{ x, y: ty }}
      transition={transition}
      role="img"
      aria-label={`pointer ${name}`}
    >
      {content}
    </motion.g>
  );
}
