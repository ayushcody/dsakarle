"use client";

/**
 * Stack scene — a vertical pile of slabs in an open-top container, a `top`
 * tag, ghost capacity slots, index labels (0 at the bottom) and a push / pop
 * value drawn beside the stack. Geometry lives in ./stack-layout.
 *
 * The exported names are the contract the dispatcher (../layout.ts,
 * ../SceneRenderer.tsx) relies on.
 */
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { StackScene as StackSceneData } from "@/lib/engine/types";
import { Arrow, Cell } from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { fade } from "@/lib/motion";
import { sketchLine } from "@/lib/stage/sketch";
import { FONT_MONO, SURFACE, pointerVisual } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes } from "../layout";
import {
  describeStack,
  layoutStack,
  resolveStackTarget,
  type StackLayout,
} from "./stack-layout";

export { describeStack, layoutStack, resolveStackTarget };
export type { StackLayout };

/** Open-top container: sunken wash, two walls and a floor, sketched. Springs when the capacity changes. */
function Container({ box }: { box: StackLayout["container"] }) {
  const transition = usePositionTransition("spring");
  const { left, right, top, floor } = box;
  const d = useMemo(
    () => ({
      leftWall: sketchLine(left, top, left, floor, { seed: 3 }),
      rightWall: sketchLine(right, top, right, floor, { seed: 9 }),
      floor: sketchLine(left - 1, floor, right + 1, floor, { seed: 5 }),
    }),
    [left, right, top, floor],
  );
  const stroke = { fill: "none", strokeWidth: 2.5, strokeLinecap: "round" as const, style: { stroke: SURFACE.ink3 } };
  return (
    <g aria-hidden="true">
      <motion.rect
        initial={false}
        animate={{ x: left, y: top, width: right - left, height: floor - top }}
        transition={transition}
        style={{ fill: SURFACE.sunken, opacity: 0.55 }}
      />
      <motion.path initial={false} animate={{ d: d.leftWall }} transition={transition} {...stroke} />
      <motion.path initial={false} animate={{ d: d.rightWall }} transition={transition} {...stroke} />
      <motion.path initial={false} animate={{ d: d.floor }} transition={transition} {...stroke} />
    </g>
  );
}

/** The `top` pointer: a left-pointing wedge and its name, beside the top slab. */
function TopTag({ x, y }: { x: number; y: number }) {
  const transition = usePositionTransition("snappy");
  const vis = pointerVisual("ptrB");
  return (
    <motion.g initial={false} animate={{ x, y }} transition={transition} role="img" aria-label="pointer top">
      <polygon points="0,0 9,-6 9,6" style={{ fill: vis.fill }} />
      <text
        x={14}
        y={0.5}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        style={{ fill: vis.text, fontFamily: FONT_MONO }}
      >
        top
      </text>
    </motion.g>
  );
}

export function StackSceneView({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  ariaLabel,
  className,
  notes,
  minNoteRows = 0,
}: SceneKindProps<StackSceneData>) {
  const layout = useMemo(() => layoutStack(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeStack(scene), [scene]);

  // A pushed / popped value slides in only after the first paint, so server output is never hidden.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const compact = density === "compact";
  const fs = compact ? 12 : 14;
  const inc = layout.incoming;

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
      <Container box={layout.container} />

      {layout.slabs.map((s) => (
        <Cell
          key={`slab-${s.index}`}
          x={s.x}
          y={s.y}
          w={s.w}
          h={s.h}
          value={s.value}
          marks={s.marks}
          seed={s.index + 1}
          ghost={s.ghost}
          fontSize={compact ? 15 : 18}
          rx={7}
        />
      ))}

      <g aria-hidden="true">
        {layout.slabs
          .filter((s) => !s.ghost)
          .map((s) => (
            <text
              key={`idx-${s.index}`}
              x={layout.indexX}
              y={s.y + s.h / 2 + 0.5}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={11}
              style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
            >
              {s.index}
            </text>
          ))}
        {layout.emptyLabel && (
          <text
            x={layout.emptyLabel.x}
            y={layout.emptyLabel.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
          >
            empty
          </text>
        )}
        <text
          x={layout.footer.x}
          y={layout.footer.y}
          textAnchor="middle"
          fontSize={fs - 1}
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          {layout.footer.text}
        </text>
      </g>

      {layout.topTag && <TopTag x={layout.topTag.x} y={layout.topTag.y} />}

      {inc && (
        <motion.g
          key={`incoming-${inc.direction}-${inc.value}`}
          initial={mounted.current ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={fade}
        >
          <Arrow from={inc.from} to={inc.to} role="focus" seed={inc.direction === "push" ? 21 : 22} />
          <Cell
            x={inc.slab.x}
            y={inc.slab.y}
            w={inc.slab.w}
            h={inc.slab.h}
            value={inc.value}
            marks={["focus"]}
            seed={31}
            fontSize={compact ? 15 : 18}
            rx={7}
          />
          <text
            x={inc.caption.x}
            y={inc.caption.y}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
            aria-hidden="true"
          >
            {inc.caption.text}
          </text>
        </motion.g>
      )}

      {pickable &&
        layout.slabs
          .filter((s) => !s.ghost)
          .map((s) => (
            <PickRect
              key={`pick-${s.index}`}
              x={s.x}
              y={s.y}
              w={s.w}
              h={s.h}
              rx={7}
              label={`Pick stack index ${s.index}, value ${s.value}${s.isTop ? ", top" : ""}`}
              onActivate={() => onPick?.(s.index)}
            />
          ))}
    </SceneFrame>
  );
}
