"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { LinkedListScene as ListData } from "@/lib/engine/types";
import {
  Arrow,
  Node,
  PointerTag,
  ShapeFrame,
} from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { FONT_MONO, SURFACE } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "./SceneFrame";
import { describeScene, hashSeed, layoutLinkedList, planNotes } from "./layout";

/** The `null` terminator: a dotted empty box. */
function NullBox({
  cx,
  cy,
  w,
  h,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
}) {
  const transition = usePositionTransition("spring");
  return (
    <motion.g
      initial={false}
      animate={{ x: cx, y: cy }}
      transition={transition}
      role="img"
      aria-label="null, end of list"
    >
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <ShapeFrame shape={{ kind: "rect", w, h, rx: 8 }} empty seed={97}>
          <text
            x={w / 2}
            y={h / 2 + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
          >
            null
          </text>
        </ShapeFrame>
      </g>
    </motion.g>
  );
}

/** Linked list: nodes in a row (two rows past six), `next` arrows, floating nodes below, pointer tags. */
export function LinkedListScene({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  ariaLabel,
  className,
  notes,
  minNoteRows = 0,
}: SceneKindProps<ListData>) {
  const layout = useMemo(() => layoutLinkedList(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeScene(scene), [scene]);
  const nb = layout.nullBox;

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
      {layout.links.map((l) => (
        <Arrow
          key={l.key}
          from={l.from}
          to={l.to}
          curve={l.curve}
          role={l.role}
          seed={l.seed}
        />
      ))}

      {nb && <NullBox cx={nb.cx} cy={nb.cy} w={nb.w} h={nb.h} />}

      {layout.nodes.map((n) => (
        <Node
          key={`node-${n.id}`}
          cx={n.cx}
          cy={n.cy}
          w={n.w}
          h={n.h}
          value={n.value}
          id={n.id}
          marks={n.marks}
          seed={hashSeed(n.id) + 1}
        />
      ))}

      {layout.tags.map((t) => (
        <PointerTag
          key={`ptr-${t.key}`}
          x={t.x}
          y={t.y}
          name={t.name}
          role={t.role}
          offset={t.offset}
          cellW={t.cellW}
          cellH={t.cellH}
        />
      ))}

      {pickable &&
        layout.nodes.map((n) => (
          <PickRect
            key={`pick-${n.id}`}
            x={n.cx - n.w / 2}
            y={n.cy - n.h / 2}
            w={n.w}
            h={n.h}
            rx={Math.min(n.h / 2, 16)}
            label={`Pick node ${n.id}, value ${n.value}`}
            onActivate={() => onPick?.(n.id)}
          />
        ))}
    </SceneFrame>
  );
}
