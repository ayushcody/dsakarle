"use client";

/**
 * CallTree scene — a layered tree of call chips (recursion / backtracking) and
 * a compact "call stack" pile on the right. Geometry lives in ./call-tree-layout.
 *
 * Status looks: pending = dotted outline, active = focus ring, returned =
 * solid with its result on a second line, pruned = faded, struck through and
 * badged with a cross.
 *
 * The exported names are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on.
 */
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { CallTreeScene as CallTreeSceneData } from "@/lib/engine/types";
import { ShapeFrame } from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { sketchLine } from "@/lib/stage/sketch";
import { FONT_MONO, MARK_VISUAL, SURFACE, pointerVisual } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes } from "../layout";
import {
  describeCallTree,
  layoutCallTree,
  resolveCallTreeTarget,
  type CallChipGeom,
  type CallEdgeGeom,
  type CallStackBoxGeom,
  type CallTreeLayout,
} from "./call-tree-layout";

export { describeCallTree, layoutCallTree, resolveCallTreeTarget };
export type { CallTreeLayout };

function seedOf(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) % 997;
  return h + 1;
}

interface Origin {
  x: number;
  y: number;
}

/** Parent → child connector. The path keeps one `M Q` shape so it springs when the tree reflows. */
function Connector({ edge, enter }: { edge: CallEdgeGeom; enter: boolean }) {
  const transition = usePositionTransition("spring");
  const d = useMemo(
    () => sketchLine(edge.from.x, edge.from.y, edge.to.x, edge.to.y, { seed: seedOf(edge.key) }),
    [edge.from.x, edge.from.y, edge.to.x, edge.to.y, edge.key],
  );
  const live = edge.tone === "live";
  const stroke =
    edge.tone === "live"
      ? pointerVisual("focus").stroke
      : edge.tone === "pending" || edge.tone === "pruned"
        ? SURFACE.ruleStrong
        : SURFACE.ink3;
  return (
    <motion.path
      initial={enter ? { d, opacity: 0 } : false}
      animate={{ d, opacity: edge.tone === "pending" ? 0.7 : 1 }}
      transition={transition}
      fill="none"
      strokeWidth={live ? 3 : 1.6}
      strokeLinecap="round"
      strokeDasharray={edge.tone === "pending" || edge.tone === "pruned" ? "4 4" : undefined}
      style={{ stroke }}
      aria-hidden="true"
    />
  );
}

function describeChip(c: CallChipGeom): string {
  const parts = [`call ${c.full}`, c.status];
  if (c.result) parts.push(`result ${c.result}`);
  if (c.top) parts.push("top of call stack");
  return parts.join(", ");
}

/** One call: label (mono) on the first line, `= result` once it has returned. */
function CallChip({
  chip,
  from,
  enter,
  font,
  resultFont,
}: {
  chip: CallChipGeom;
  from: Origin;
  enter: boolean;
  font: number;
  resultFont: number;
}) {
  const transition = usePositionTransition("spring");
  const pending = chip.status === "pending";
  const pruned = chip.status === "pruned";
  const hasSecond = chip.result !== null || pruned;
  const resultFill =
    chip.resultTone === "ok"
      ? MARK_VISUAL.found.text
      : chip.resultTone === "bad"
        ? MARK_VISUAL.error.text
        : SURFACE.ink2;

  return (
    <motion.g
      initial={enter ? { x: from.x, y: from.y, opacity: 0 } : false}
      animate={{ x: chip.x, y: chip.y, opacity: 1 }}
      transition={transition}
      role="img"
      aria-label={describeChip(chip)}
    >
      <ShapeFrame
        shape={{ kind: "rect", w: chip.w, h: chip.h, rx: 11 }}
        marks={chip.marks}
        empty={pending}
        seed={seedOf(chip.id)}
        changeKey={chip.result ?? chip.status}
        baseFill={pending ? undefined : SURFACE.raised}
      >
        <text
          x={chip.w / 2}
          y={hasSecond ? chip.h * 0.36 : chip.h / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={font}
          fontWeight={600}
          style={{ fill: pending ? SURFACE.ink3 : SURFACE.ink, fontFamily: FONT_MONO }}
        >
          {chip.label}
        </text>
        {chip.result !== null && (
          <motion.text
            key={chip.result}
            initial={enter ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={transition}
            x={chip.w / 2}
            y={chip.h * 0.72}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={resultFont}
            fontWeight={600}
            style={{ fill: resultFill, fontFamily: FONT_MONO }}
          >
            {chip.result}
          </motion.text>
        )}
        {pruned && (
          <text
            x={chip.w / 2}
            y={chip.h * 0.72}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={resultFont}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
          >
            pruned
          </text>
        )}
      </ShapeFrame>
      {pruned && (
        <g aria-hidden="true">
          <circle cx={chip.w - 2} cy={2} r={8} style={{ fill: MARK_VISUAL.error.stroke }} />
          <text
            x={chip.w - 2}
            y={2.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            style={{ fill: SURFACE.raised, fontFamily: FONT_MONO }}
          >
            ✕
          </text>
        </g>
      )}
    </motion.g>
  );
}

/** One entry of the recursion stack pile. */
function StackBox({ box, enter, font }: { box: CallStackBoxGeom; enter: boolean; font: number }) {
  const transition = usePositionTransition("spring");
  return (
    <motion.g
      initial={enter ? { x: box.x, y: box.y - 18, opacity: 0 } : false}
      animate={{ x: box.x, y: box.y, opacity: 1 }}
      transition={transition}
      role="img"
      aria-label={`stack entry ${box.label}${box.top ? ", top" : ""}`}
    >
      <ShapeFrame
        shape={{ kind: "rect", w: box.w, h: box.h, rx: 7 }}
        marks={box.top ? ["focus"] : []}
        seed={seedOf(`stk-${box.id}`)}
        changeKey={box.id}
      >
        <text
          x={box.w / 2}
          y={box.h / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={font}
          fontWeight={box.top ? 700 : 500}
          style={{ fill: SURFACE.ink, fontFamily: FONT_MONO }}
        >
          {box.label}
        </text>
      </ShapeFrame>
    </motion.g>
  );
}

export function CallTreeSceneView({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  ariaLabel,
  className,
  notes,
  minNoteRows = 0,
}: SceneKindProps<CallTreeSceneData>) {
  const layout = useMemo(() => layoutCallTree(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeCallTree(scene), [scene]);

  // New calls grow out of their parent only after the first paint, so server output is never hidden.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const enter = mounted.current;

  const chipBy = useMemo(() => new Map(layout.chips.map((c) => [c.id, c])), [layout.chips]);
  const col = layout.stack;
  const dividerD = useMemo(
    () => sketchLine(col.divider.x, col.divider.y1, col.divider.x, col.divider.y2, { seed: 13 }),
    [col.divider.x, col.divider.y1, col.divider.y2],
  );
  const floorD = useMemo(
    () => sketchLine(col.floor.x1, col.floor.y, col.floor.x2, col.floor.y, { seed: 17 }),
    [col.floor.x1, col.floor.x2, col.floor.y],
  );

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
      <g aria-hidden="true">
        <path d={dividerD} fill="none" strokeWidth={1.4} strokeDasharray="3 5" strokeLinecap="round" style={{ stroke: SURFACE.ruleStrong }} />
        <path d={floorD} fill="none" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: SURFACE.ink3 }} />
        <text
          x={col.header.x}
          y={col.header.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {col.header.text}
        </text>
        {col.empty && (
          <text
            x={col.empty.x + col.empty.w / 2}
            y={col.empty.y + col.empty.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
          >
            empty
          </text>
        )}
      </g>

      {layout.edges.map((e) => (
        <Connector key={`edge-${e.key}`} edge={e} enter={enter} />
      ))}

      {layout.chips.map((c) => {
        const par = c.parent ? chipBy.get(c.parent) : undefined;
        return (
          <CallChip
            key={`call-${c.id}`}
            chip={c}
            from={par ? { x: par.x + (par.w - c.w) / 2, y: par.y } : { x: c.x, y: c.y }}
            enter={enter}
            font={layout.font}
            resultFont={layout.resultFont}
          />
        );
      })}

      {col.boxes.map((b) => (
        <StackBox key={`stk-${b.id}`} box={b} enter={enter} font={layout.stackFont} />
      ))}

      {pickable &&
        layout.chips.map((c) => (
          <PickRect
            key={`pick-${c.id}`}
            x={c.x}
            y={c.y}
            w={c.w}
            h={c.h}
            rx={11}
            label={`Pick call ${c.full}, ${c.status}`}
            onActivate={() => onPick?.(c.id)}
          />
        ))}
    </SceneFrame>
  );
}
