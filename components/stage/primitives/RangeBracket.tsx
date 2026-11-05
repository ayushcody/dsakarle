"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { sketchBracket } from "@/lib/stage/sketch";
import { FONT_MONO, WINDOW_VISUAL } from "@/lib/stage/semantics";
import { usePositionTransition } from "./motion-utils";

export interface RangeBracketProps {
  /** Left and right edges (px). Both are spring-animated. */
  x1: number;
  x2: number;
  /** y of the bracket bar. */
  y: number;
  /** Which side of the cells the bracket sits on. Default `below` (ticks point up). */
  side?: "below" | "above";
  depth?: number;
  /** Short caption centred on the bar, e.g. `sum = 9`. */
  label?: string;
  /** Optional tinted rect behind the cells: y and height. Omit for bracket only. */
  washY?: number;
  washH?: number;
  /** How far the wash extends past x1 / x2. Default 4. */
  washPad?: number;
  seed?: number;
}

/**
 * The active window: a sketched bracket plus an optional tint (`washY`/`washH`).
 * Render it before the cells so the tint sits behind them.
 */
export function RangeBracket({
  x1,
  x2,
  y,
  side = "below",
  depth = 8,
  label,
  washY,
  washH,
  washPad = 4,
  seed = 3,
}: RangeBracketProps) {
  const transition = usePositionTransition("spring");
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  const d = useMemo(
    () => sketchBracket(lo, hi, y, { seed, depth, side }),
    [lo, hi, y, seed, depth, side],
  );
  const labelY = side === "below" ? y + 16 : y - 8;

  return (
    <g role="img" aria-label={label ? `window, ${label}` : "window"}>
      {washY !== undefined && washH !== undefined && (
        <motion.rect
          initial={false}
          animate={{
            x: lo - washPad,
            y: washY,
            width: hi - lo + washPad * 2,
            height: washH,
          }}
          transition={transition}
          rx={10}
          style={{ fill: WINDOW_VISUAL.wash }}
        />
      )}
      <motion.path
        initial={false}
        animate={{ d }}
        transition={transition}
        fill="none"
        strokeWidth={WINDOW_VISUAL.cue.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: WINDOW_VISUAL.stroke }}
      />
      {label && (
        <motion.text
          initial={false}
          animate={{ x: (lo + hi) / 2 }}
          transition={transition}
          y={labelY}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          style={{ fill: WINDOW_VISUAL.text, fontFamily: FONT_MONO }}
        >
          {label}
        </motion.text>
      )}
    </g>
  );
}
