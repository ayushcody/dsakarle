"use client";

import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Annotation as AnnotationData } from "@/lib/engine/types";
import type { PickTarget } from "@/components/stage/contracts";
import { Annotation, Defs, GraphPaper, StageIdsProvider } from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { pointerVisual } from "@/lib/stage/semantics";
import type { Density, NotePlan } from "./layout";

/** Props every single-svg scene layout (array, linked list, hash map) accepts. */
export interface SceneKindProps<S> {
  scene: S;
  density?: Density;
  /** Cells / nodes / buckets become focusable buttons. */
  pickable?: boolean;
  onPick?: (target: PickTarget) => void;
  ariaLabel?: string;
  className?: string;
  /** Extra notes (ScenePicture callouts), drawn with the scene's own annotations. */
  notes?: AnnotationData[];
  /** Rows of note space to keep above the scene even when it has no notes (keeps the height steady between frames). */
  minNoteRows?: number;
}

const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
};

export interface SceneFrameProps {
  /** Size of the layout's own drawing area. */
  width: number;
  height: number;
  plan: NotePlan;
  ariaLabel?: string;
  /** Plain-text description for screen readers (see `describeScene`). */
  summary: string;
  interactive: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The one responsive svg every scene renders into: graph paper, shared defs,
 * the scene content (shifted down by the note band) and the handwritten notes.
 * The viewBox is sized to content; the svg scales down to its container but
 * never grows past its natural width.
 */
export function SceneFrame({
  width,
  height,
  plan,
  ariaLabel,
  summary,
  interactive,
  className,
  children,
}: SceneFrameProps) {
  const total = height + plan.top + plan.bottom;
  const label = ariaLabel ?? summary;
  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${round(width)} ${round(total)}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        // An svg with role="img" hides its children from assistive tech, which
        // would hide the pick buttons, so a pickable scene is a group instead.
        role={interactive ? "group" : "img"}
        aria-label={label}
        style={{
          display: "block",
          width: "100%",
          maxWidth: width,
          height: "auto",
          marginInline: "auto",
          overflow: "visible",
        }}
      >
        <StageIdsProvider>
          <Defs />
          <GraphPaper width={width} height={total} />
          <g transform={`translate(0 ${round(plan.top)})`}>{children}</g>
          {plan.items.map((n) => (
            <Annotation
              key={n.key}
              x={n.x}
              y={n.y}
              text={n.text}
              target={n.tip}
              align={n.align}
              fontSize={plan.fontSize}
              seed={7}
            />
          ))}
        </StageIdsProvider>
      </svg>
      <span style={VISUALLY_HIDDEN}>{summary}</span>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PickRectProps {
  /** The shape being picked; the focus outline sits 3px outside it. */
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  label: string;
  onActivate: () => void;
}

/**
 * Transparent button laid over a cell / node / bucket. Keyboard: Enter or
 * Space. Hover and focus draw an outline in `--focus-ring`.
 */
export function PickRect({ x, y, w, h, rx = 9, label, onActivate }: PickRectProps) {
  const transition = usePositionTransition("spring");
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const pad = 3;

  const onKeyDown = (e: KeyboardEvent<SVGRectElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  };

  return (
    <motion.rect
      initial={false}
      animate={{ x: x - pad, y: y - pad, width: w + pad * 2, height: h + pad * 2 }}
      transition={transition}
      rx={rx + pad}
      role="button"
      tabIndex={0}
      aria-label={label}
      pointerEvents="all"
      onClick={onActivate}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      strokeWidth={2.5}
      style={{
        cursor: "pointer",
        outline: "none",
        fill: hover || focus ? pointerVisual("focus").wash : "transparent",
        stroke: hover || focus ? "var(--focus-ring, currentColor)" : "transparent",
      }}
    />
  );
}
