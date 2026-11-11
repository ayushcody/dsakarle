"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { fade } from "@/lib/motion";
import { sketchArrow, type Point } from "@/lib/stage/sketch";
import { FONT_HAND, SURFACE } from "@/lib/stage/semantics";
import { useStageScope } from "./ids";

export interface AnnotationProps {
  /** Where the text sits. */
  x: number;
  y: number;
  text: string;
  /** The point the small leader line touches. Omit for a note with no leader. */
  target?: Point;
  /** Text alignment around x. Default `middle`. */
  align?: "start" | "middle" | "end";
  fontSize?: number;
  seed?: number;
  idPrefix?: string;
}

/** A handwritten margin note (Caveat) with a short sketched leader. Fades in; never loops. */
export function Annotation({
  x,
  y,
  text,
  target,
  align = "middle",
  fontSize = 19,
  seed = 7,
  idPrefix,
}: AnnotationProps) {
  const ids = useStageScope(idPrefix);
  const lines = text.split("\n");
  const widest = Math.max(...lines.map((l) => l.length));
  const textW = widest * fontSize * 0.42; // Caveat is narrow
  const textH = lines.length * fontSize * 1.05;
  const cx =
    align === "start" ? x + textW / 2 : align === "end" ? x - textW / 2 : x;

  const leader = useMemo(() => {
    if (!target) return null;
    const below = target.y > y;
    const start: Point = {
      x:
        Math.abs(target.x - cx) < textW / 2
          ? target.x
          : cx + Math.sign(target.x - cx) * (textW / 2 + 4),
      y: below ? y + textH - fontSize * 0.55 + 4 : y - fontSize * 0.85 - 4,
    };
    return sketchArrow(start, target, { seed, curve: 0.18 });
  }, [target?.x, target?.y, x, y, cx, textW, textH, fontSize, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade}
      role="note"
      aria-label={text.replace(/\n/g, " ")}
    >
      <text
        x={x}
        y={y}
        textAnchor={align}
        fontSize={fontSize}
        fontWeight={500}
        style={{ fill: SURFACE.ink2, fontFamily: FONT_HAND }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize * 1.05}>
            {line}
          </tspan>
        ))}
      </text>
      {leader && (
        <path
          d={leader}
          fill="none"
          strokeWidth={1.4}
          strokeLinecap="round"
          markerEnd={ids.markerUrl("neutral")}
          style={{ stroke: SURFACE.ink3 }}
        />
      )}
    </motion.g>
  );
}
