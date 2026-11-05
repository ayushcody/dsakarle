"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { MarkRole } from "@/lib/engine/types";
import { FONT_MONO, SURFACE } from "@/lib/stage/semantics";
import { describeMarks } from "./Cell";
import { ShapeFrame } from "./ShapeFrame";
import { usePositionTransition } from "./motion-utils";

export interface BucketProps {
  /** Top-left of the bucket row. */
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
  marks?: readonly MarkRole[];
  seed?: number;
  /**
   * Chained entries. Coordinates are relative to the bucket's top-left, so
   * place a Node at `(slotX, h / 2)` to sit inside the row.
   */
  children?: ReactNode;
  idPrefix?: string;
}

/** One hash-map bucket: a sunken slot with its index on the left and room for a chain. */
export function Bucket({
  x,
  y,
  w,
  h,
  index,
  marks = [],
  seed,
  children,
  idPrefix,
}: BucketProps) {
  const transition = usePositionTransition("spring");
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={transition}
      role="group"
      aria-label={`bucket ${index}${describeMarks(marks)}`}
    >
      <ShapeFrame
        shape={{ kind: "rect", w, h, rx: 6 }}
        marks={marks}
        seed={seed ?? index + 1}
        baseFill={SURFACE.sunken}
        idPrefix={idPrefix}
      />
      <text
        x={-10}
        y={h / 2 + 0.5}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
      >
        {index}
      </text>
      {children}
    </motion.g>
  );
}
