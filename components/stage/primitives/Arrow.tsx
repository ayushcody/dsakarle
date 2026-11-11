"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { sketchArrow, type Point } from "@/lib/stage/sketch";
import { FONT_MONO, arrowVisual, type ArrowRole } from "@/lib/stage/semantics";
import { useStageScope } from "./ids";
import { usePositionTransition } from "./motion-utils";

export interface ArrowProps {
  from: Point;
  to: Point;
  /** Bend as a fraction of length; positive bulges clockwise on screen. Default 0. */
  curve?: number;
  role?: ArrowRole;
  dashed?: boolean;
  /** Small caption at the middle of the shaft. */
  label?: string;
  seed?: number;
  strokeWidth?: number;
  idPrefix?: string;
}

/**
 * Sketched arrow with an open head (an SVG marker from <Defs/>). The shaft is
 * always the same `M Q` shape, so changing `from`/`to` interpolates the path
 * with a spring.
 */
export function Arrow({
  from,
  to,
  curve = 0,
  role = "neutral",
  dashed = false,
  label,
  seed = 5,
  strokeWidth = 1.8,
  idPrefix,
}: ArrowProps) {
  const ids = useStageScope(idPrefix);
  const transition = usePositionTransition("spring");
  const vis = arrowVisual(role);
  const d = useMemo(
    () => sketchArrow(from, to, { seed, curve }),
    [from.x, from.y, to.x, to.y, seed, curve], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Caption sits on the control-ish midpoint, nudged off the shaft.
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const nx = -(to.y - from.y) / len;
  const ny = (to.x - from.x) / len;
  const bulge = curve * len;
  const mx = (from.x + to.x) / 2 + nx * (bulge + 10 * Math.sign(bulge || 1));
  const my = (from.y + to.y) / 2 + ny * (bulge + 10 * Math.sign(bulge || 1));

  return (
    <g aria-hidden={label ? undefined : true}>
      <motion.path
        initial={false}
        animate={{ d }}
        transition={transition}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd={ids.markerUrl(role)}
        style={{ stroke: vis.stroke }}
      />
      {label && (
        <motion.text
          initial={false}
          animate={{ x: mx, y: my }}
          transition={transition}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          style={{ fill: vis.text, fontFamily: FONT_MONO }}
        >
          {label}
        </motion.text>
      )}
    </g>
  );
}
