"use client";

/**
 * Grid scene: DP tables, BFS on a grid, matrices.
 *
 * Geometry lives in ./grid-layout (pure). Cells are Cell primitives (null is
 * an empty slot, `#` is a wall), row / column labels are mono text in the
 * margins, pointers are flags on a cell's edge (ptrA below, ptrB / focus
 * above, focus also rings the cell) and `arrows` draw dependencies.
 *
 * Note targets: `cell:<r>,<c>`, `row:<r>`, `col:<c>`, `ptr:<name>`.
 * Pickable: cells (pick target = "r,c").
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { GridScene as GridSceneData } from "@/lib/engine/types";
import { Arrow, Cell, ShapeFrame } from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { FONT_MONO, RING_WIDTH, SURFACE, pointerVisual } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes } from "../layout";
import {
  describeGrid,
  layoutGrid,
  resolveGridTarget,
  type GridCellGeom,
  type GridFlagGeom,
  type GridLayout,
  type GridRingGeom,
} from "./grid-layout";

export { describeGrid, layoutGrid, resolveGridTarget };
export type { GridLayout };

/** A wall (`#`): a solid dark block so it reads as an obstacle, not a value. */
function WallCell({ cell }: { cell: GridCellGeom }) {
  const transition = usePositionTransition("spring");
  return (
    <motion.g
      initial={false}
      animate={{ x: cell.x, y: cell.y }}
      transition={transition}
      role="img"
      aria-label={`row ${cell.r}, column ${cell.c}, wall`}
    >
      <ShapeFrame
        shape={{ kind: "rect", w: cell.w, h: cell.h, rx: 6 }}
        marks={cell.marks}
        baseFill={SURFACE.ink3}
        baseStroke={SURFACE.ink2}
        seed={cell.seed}
        changeKey="#"
      >
        <text
          x={cell.w / 2}
          y={cell.h / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.min(18, cell.h * 0.38)}
          fontWeight={700}
          style={{ fill: SURFACE.paper, fontFamily: FONT_MONO }}
        >
          #
        </text>
      </ShapeFrame>
    </motion.g>
  );
}

/** Pointer flag straddling a cell edge: a small pill with a triangle showing which way it points. */
function Flag({ flag }: { flag: GridFlagGeom }) {
  const transition = usePositionTransition("snappy");
  const vis = pointerVisual(flag.role);
  const up = flag.side === "below"; // ptrA hangs under its cell, triangle pointing up
  const tri = up ? "-3.5,2.5 3.5,2.5 0,-3" : "-3.5,-2.5 3.5,-2.5 0,3";
  return (
    <motion.g
      initial={false}
      animate={{ x: flag.x, y: flag.y }}
      transition={transition}
      role="img"
      aria-label={`pointer ${flag.name}`}
    >
      <rect
        x={-flag.w / 2}
        y={-flag.h / 2}
        width={flag.w}
        height={flag.h}
        rx={flag.h / 2}
        strokeWidth={1.5}
        style={{ fill: SURFACE.raised, stroke: vis.stroke }}
      />
      <g transform={`translate(${-flag.w / 2 + 10} 0.5)`}>
        <polygon points={tri} style={{ fill: vis.stroke }} />
      </g>
      <text
        x={-flag.w / 2 + 17}
        y={0.5}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        style={{ fill: vis.text, fontFamily: FONT_MONO }}
      >
        {flag.name}
      </text>
    </motion.g>
  );
}

/** Ring for a cell that carries a `focus` pointer (the `focus` mark draws its own). */
function FocusRing({ ring }: { ring: GridRingGeom }) {
  const transition = usePositionTransition("snappy");
  return (
    <motion.rect
      initial={false}
      animate={{ x: ring.x - 3, y: ring.y - 3, width: ring.w + 6, height: ring.h + 6 }}
      transition={transition}
      rx={9}
      fill="none"
      strokeWidth={RING_WIDTH}
      aria-hidden="true"
      style={{ stroke: pointerVisual("focus").stroke }}
    />
  );
}

export function GridSceneView({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  className,
  ariaLabel,
  notes,
  minNoteRows = 0,
}: SceneKindProps<GridSceneData>) {
  const layout = useMemo(() => layoutGrid(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeGrid(scene), [scene]);
  const labelSize = density === "compact" ? 10 : 11;

  return (
    <SceneFrame
      width={layout.width}
      height={layout.height}
      plan={plan}
      ariaLabel={ariaLabel}
      summary={summary}
      interactive={pickable}
      className={className}
    >
      {layout.label && (
        <text
          transform={`translate(${layout.label.x} ${layout.label.y}) rotate(-90)`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          aria-hidden="true"
          style={{ fill: SURFACE.ink2, fontFamily: FONT_MONO }}
        >
          {layout.label.text}
        </text>
      )}

      {layout.colLabels.map((l) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontSize={labelSize}
          aria-hidden="true"
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {l.text}
        </text>
      ))}
      {layout.rowLabels.map((l) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={labelSize}
          aria-hidden="true"
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {l.text}
        </text>
      ))}

      {layout.cells.map((c) =>
        c.wall ? (
          <WallCell key={`cell-${c.r}-${c.c}`} cell={c} />
        ) : (
          <Cell
            key={`cell-${c.r}-${c.c}`}
            x={c.x}
            y={c.y}
            w={c.w}
            h={c.h}
            value={c.value}
            marks={c.marks}
            seed={c.seed}
          />
        ),
      )}

      {layout.rings.map((rg) => (
        <FocusRing key={rg.key} ring={rg} />
      ))}

      {layout.arrows.map((a) => (
        <Arrow
          key={`arrow-${a.key}`}
          from={a.p0}
          to={a.p1}
          curve={a.curve}
          role="compare"
          seed={a.seed}
          strokeWidth={2}
        />
      ))}

      {layout.flags.map((f) => (
        <Flag key={`ptr-${f.key}`} flag={f} />
      ))}

      {pickable &&
        layout.cells.map((c) => (
          <PickRect
            key={`pick-${c.r}-${c.c}`}
            x={c.x}
            y={c.y}
            w={c.w}
            h={c.h}
            rx={6}
            label={`Pick row ${c.r}, column ${c.c}${c.value === null ? ", empty" : `, value ${c.value}`}`}
            onActivate={() => onPick?.(`${c.r},${c.c}`)}
          />
        ))}
    </SceneFrame>
  );
}
