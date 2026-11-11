"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { MarkRole } from "@/lib/engine/types";
import { FONT_MONO, SURFACE } from "@/lib/stage/semantics";
import { ShapeFrame } from "./ShapeFrame";
import { usePositionTransition } from "./motion-utils";

export interface CellProps {
  /** Top-left of the cell. Animated with a spring when it changes. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** null renders an empty slot. */
  value: number | string | null;
  /** Index label drawn below the cell. */
  index?: number | string;
  marks?: readonly MarkRole[];
  /** Seed for the hand-drawn border; pass the index so neighbours differ. */
  seed?: number;
  /** Faded capacity slot (drawn after the last real cell). */
  ghost?: boolean;
  fontSize?: number;
  rx?: number;
  /** Distance from the cell bottom to the index baseline. Default 16. */
  indexOffset?: number;
  /** Overrides what the flash is keyed by (defaults to the value). */
  changeKey?: string | number;
  idPrefix?: string;
}

export function describeMarks(marks: readonly MarkRole[]): string {
  return marks.length ? `, ${marks.join(", ")}` : "";
}

/** One array cell: mono value, index below, role cues. Renders inside a parent <svg>. */
export function Cell({
  x,
  y,
  w,
  h,
  value,
  index,
  marks = [],
  seed = 1,
  ghost = false,
  fontSize,
  rx = 6,
  indexOffset = 16,
  changeKey,
  idPrefix,
}: CellProps) {
  const transition = usePositionTransition("spring");
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const text = value === null ? "" : String(value);
  const base = fontSize ?? Math.min(20, h * 0.4);
  const fit = (w - 8) / Math.max(1, text.length * 0.62);
  const size = Math.max(9, Math.min(base, fit));

  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={transition}
      role="img"
      aria-label={`${index !== undefined ? `index ${index}, ` : ""}${value === null ? "empty" : `value ${text}`}${describeMarks(marks)}`}
    >
      <ShapeFrame
        shape={{ kind: "rect", w, h, rx }}
        marks={marks}
        empty={value === null}
        ghost={ghost}
        seed={seed}
        changeKey={changeKey ?? text}
        idPrefix={idPrefix}
      >
        {value !== null && (
          <motion.text
            key={text}
            initial={mounted.current ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={transition}
            x={w / 2}
            y={h / 2 + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size}
            fontWeight={600}
            style={{ fill: SURFACE.ink, fontFamily: FONT_MONO }}
          >
            {text}
          </motion.text>
        )}
      </ShapeFrame>
      {index !== undefined && (
        <text
          x={w / 2}
          y={h + indexOffset}
          textAnchor="middle"
          fontSize={11}
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {index}
        </text>
      )}
    </motion.g>
  );
}
