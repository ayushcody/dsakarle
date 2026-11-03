"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { MarkRole } from "@/lib/engine/types";
import { FONT_MONO, SURFACE } from "@/lib/stage/semantics";
import { describeMarks } from "./Cell";
import { ShapeFrame } from "./ShapeFrame";
import { usePositionTransition } from "./motion-utils";

export interface NodeProps {
  /** Centre of the node. Animated with a spring when it changes. */
  cx: number;
  cy: number;
  /** Give `r` for a circle (trees, graphs); otherwise a w x h rounded box (linked lists). */
  r?: number;
  w?: number;
  h?: number;
  value: number | string;
  /** Small label under the node, e.g. its id (`n2`). */
  id?: string;
  marks?: readonly MarkRole[];
  seed?: number;
  fontSize?: number;
  ghost?: boolean;
  changeKey?: string | number;
  idPrefix?: string;
}

/** A list/tree/graph node. Use `getNodeAnchors` to attach arrows to its edges. */
export function Node({
  cx,
  cy,
  r,
  w = 64,
  h = 44,
  value,
  id,
  marks = [],
  seed = 1,
  fontSize,
  ghost = false,
  changeKey,
  idPrefix,
}: NodeProps) {
  const transition = usePositionTransition("spring");
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const text = String(value);
  const halfW = r ?? w / 2;
  const halfH = r ?? h / 2;
  const base = fontSize ?? Math.min(18, halfH * 0.85);
  const fit = (halfW * 2 - 10) / Math.max(1, text.length * 0.62);
  const size = Math.max(9, Math.min(base, fit));

  const shape =
    r !== undefined
      ? ({ kind: "circle", r } as const)
      : ({ kind: "rect", w, h, rx: Math.min(h / 2, 16) } as const);

  const content = (
    <ShapeFrame
      shape={shape}
      marks={marks}
      ghost={ghost}
      seed={seed}
      changeKey={changeKey ?? text}
      idPrefix={idPrefix}
    >
      <motion.text
        key={text}
        initial={mounted.current ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={transition}
        x={r !== undefined ? 0 : w / 2}
        y={(r !== undefined ? 0 : h / 2) + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size}
        fontWeight={600}
        style={{ fill: SURFACE.ink, fontFamily: FONT_MONO }}
      >
        {text}
      </motion.text>
    </ShapeFrame>
  );

  return (
    <motion.g
      initial={false}
      animate={{ x: cx, y: cy }}
      transition={transition}
      role="img"
      aria-label={`node ${id ?? text}, value ${text}${describeMarks(marks)}`}
    >
      {r !== undefined ? (
        content
      ) : (
        <g transform={`translate(${-w / 2} ${-h / 2})`}>{content}</g>
      )}
      {id !== undefined && (
        <text
          x={0}
          y={halfH + 16}
          textAnchor="middle"
          fontSize={11}
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {id}
        </text>
      )}
    </motion.g>
  );
}

/** Edge anchor points of a node centred at (cx, cy), for Arrow endpoints. */
export function getNodeAnchors(
  cx: number,
  cy: number,
  node: { r?: number; w?: number; h?: number },
  gap = 3,
) {
  const hw = node.r ?? (node.w ?? 64) / 2;
  const hh = node.r ?? (node.h ?? 44) / 2;
  return {
    left: { x: cx - hw - gap, y: cy },
    right: { x: cx + hw + gap, y: cy },
    top: { x: cx, y: cy - hh - gap },
    bottom: { x: cx, y: cy + hh + gap },
  };
}
