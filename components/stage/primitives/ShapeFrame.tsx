"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { MarkRole } from "@/lib/engine/types";
import { flash } from "@/lib/motion";
import {
  sketchCircle,
  sketchLine,
  sketchRect,
  zigzag,
} from "@/lib/stage/sketch";
import {
  COMPARE_DASH,
  FONT_MONO,
  MARK_VISUAL,
  RING_WIDTH,
  SURFACE,
  resolveShapeLook,
} from "@/lib/stage/semantics";
import { useStageScope } from "./ids";
import { useColorTransition, usePositionTransition } from "./motion-utils";

export type FrameShape =
  | { kind: "rect"; w: number; h: number; rx: number }
  | { kind: "circle"; r: number };

export interface ShapeFrameProps {
  shape: FrameShape;
  marks?: readonly MarkRole[];
  /** Empty slot: dashed dotted outline, no fill. */
  empty?: boolean;
  /** Faded capacity slot. */
  ghost?: boolean;
  seed?: number;
  roughness?: number;
  baseFill?: string;
  baseStroke?: string;
  /** Changes when the content changes; keys the highlighter flash. */
  changeKey?: string | number;
  /** Drawn inside the frame, above fill/hatch/flash and below rings/strike. */
  children?: ReactNode;
  idPrefix?: string;
}

function bbox(shape: FrameShape) {
  return shape.kind === "rect"
    ? { x: 0, y: 0, w: shape.w, h: shape.h }
    : { x: -shape.r, y: -shape.r, w: shape.r * 2, h: shape.r * 2 };
}

/** Plain (non-sketched) element for overlays; `grow` expands it outward. */
function Plain({
  shape,
  grow = 0,
  ...rest
}: { shape: FrameShape; grow?: number } & Record<string, unknown>) {
  if (shape.kind === "circle") return <circle r={shape.r + grow} {...rest} />;
  return (
    <rect
      x={-grow}
      y={-grow}
      width={shape.w + grow * 2}
      height={shape.h + grow * 2}
      rx={shape.rx + grow}
      {...rest}
    />
  );
}

/**
 * Shared body for Cell / Node / Bucket: sketched border, role fill, and every
 * non-colour cue (hatch, flash, ring, dashed outline, strike, badges).
 * Local coordinates: rect origin is its top-left, circle origin is its centre.
 */
export function ShapeFrame({
  shape,
  marks = [],
  empty = false,
  ghost = false,
  seed = 1,
  roughness = 0.6,
  baseFill,
  baseStroke,
  changeKey,
  children,
  idPrefix,
}: ShapeFrameProps) {
  const ids = useStageScope(idPrefix);
  const colorTransition = useColorTransition();
  const fadeTransition = usePositionTransition("snappy");
  const look = resolveShapeLook(marks, { fill: baseFill, stroke: baseStroke });
  const b = bbox(shape);

  const outline = useMemo(
    () =>
      shape.kind === "rect"
        ? sketchRect(0, 0, shape.w, shape.h, {
            seed,
            roughness,
            radius: shape.rx,
          })
        : sketchCircle(0, 0, shape.r, { seed, roughness }),
    [shape, seed, roughness],
  );

  const bodyStyle = {
    fill: empty ? "transparent" : look.fill,
    stroke: empty ? SURFACE.ruleStrong : look.stroke,
    transition: colorTransition,
  };

  const hasFound = look.found;
  const hasError = look.error;
  const badgeR = 8;
  // Badges sit on the top-right corner (found) / just left of it when both apply.
  const badgeCx = shape.kind === "rect" ? b.w - 2 : b.w / 2 - 4 + b.x;
  const badgeCy = shape.kind === "rect" ? 2 : b.y + 4;
  const badge = (glyph: string, cx: number, role: MarkRole) => (
    <g key={role} aria-hidden="true">
      <circle
        cx={cx}
        cy={badgeCy}
        r={badgeR}
        style={{ fill: MARK_VISUAL[role].stroke }}
      />
      <text
        x={cx}
        y={badgeCy + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        style={{ fill: SURFACE.raised, fontFamily: FONT_MONO }}
      >
        {glyph}
      </text>
    </g>
  );

  return (
    <motion.g
      initial={false}
      animate={{ opacity: ghost ? 0.45 : look.opacity }}
      transition={fadeTransition}
    >
      <path
        d={outline}
        strokeWidth={empty ? 1.5 : look.strokeWidth}
        strokeDasharray={empty ? "2 5" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={bodyStyle}
      />

      {look.hatch && (
        <Plain shape={shape} fill={ids.hatchUrl} pointerEvents="none" />
      )}

      {look.flash && (
        <motion.g
          key={`flash-${changeKey ?? "x"}`}
          initial={{ opacity: 0.95 }}
          animate={{ opacity: 0 }}
          transition={flash}
        >
          <Plain
            shape={shape}
            pointerEvents="none"
            style={{ fill: MARK_VISUAL.changed.fill }}
          />
        </motion.g>
      )}

      {children}

      {hasError && (
        <path
          d={zigzag(b.x + 6, b.y + b.h - 7, b.w - 12)}
          fill="none"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: MARK_VISUAL.error.stroke }}
        />
      )}

      {look.dashed && (
        <Plain
          shape={shape}
          grow={look.ring ? 1 : 2}
          fill="none"
          strokeWidth={RING_WIDTH}
          strokeDasharray={COMPARE_DASH}
          style={{ stroke: MARK_VISUAL.compare.stroke }}
        />
      )}

      {look.ring && (
        <Plain
          shape={shape}
          grow={look.dashed ? 4 : 3}
          fill="none"
          strokeWidth={RING_WIDTH}
          style={{ stroke: MARK_VISUAL.focus.stroke }}
        />
      )}

      {look.strike && (
        <path
          d={sketchLine(b.x + 5, b.y + b.h / 2, b.x + b.w - 5, b.y + b.h / 2, {
            seed: seed + 11,
          })}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: MARK_VISUAL.discarded.stroke }}
        />
      )}

      {hasFound && badge("✓", hasError ? badgeCx - 18 : badgeCx, "found")}
      {hasError && badge("✕", badgeCx, "error")}
    </motion.g>
  );
}

export { bbox as frameBox };
