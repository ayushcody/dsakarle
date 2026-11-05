"use client";

import { useMemo } from "react";
import type { HashMapScene as HashData } from "@/lib/engine/types";
import { Arrow, Bucket, Node } from "@/components/stage/primitives";
import { FONT_MONO, SURFACE, pointerVisual } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "./SceneFrame";
import { describeScene, hashSeed, layoutHashMap, planNotes } from "./layout";

/** Hash map: stacked bucket rows with chained entry chips, and the `key → hash → bucket` line above. */
export function HashMapScene({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  ariaLabel,
  className,
  notes,
  minNoteRows = 0,
}: SceneKindProps<HashData>) {
  const layout = useMemo(() => layoutHashMap(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeScene(scene), [scene]);
  const hs = layout.hashing;
  const fs = density === "compact" ? 13 : 15;

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
      {layout.buckets.map((b) => (
        <Bucket
          key={`bucket-${b.index}`}
          x={b.x}
          y={b.y}
          w={b.w}
          h={b.h}
          index={b.index}
          marks={b.marks}
        />
      ))}

      {layout.chains.map((c) => (
        <Arrow
          key={c.key}
          from={c.from}
          to={c.to}
          strokeWidth={1.4}
          seed={hashSeed(c.key)}
        />
      ))}

      {layout.entries.map((e) => (
        <Node
          key={e.key}
          cx={e.cx}
          cy={e.cy}
          w={e.w}
          h={e.h}
          value={e.label}
          marks={e.marks}
          fontSize={layout.chipFont}
          seed={hashSeed(e.key) + 1}
        />
      ))}

      {hs && (
        <g>
          <text
            key={`${hs.keyText}-${hs.hashText}`}
            x={hs.x}
            y={hs.y}
            fontSize={fs}
            style={{ fill: SURFACE.ink2, fontFamily: FONT_MONO }}
          >
            <tspan fontWeight={600} style={{ fill: SURFACE.ink }}>
              {hs.keyText}
            </tspan>
            <tspan>{`  →  ${hs.hashText}  →  ${hs.modText} = `}</tspan>
            <tspan
              fontWeight={700}
              style={{ fill: pointerVisual("focus").text }}
            >
              {hs.bucketText}
            </tspan>
          </text>
          <Arrow
            from={hs.arrow.from}
            to={hs.arrow.to}
            curve={hs.arrow.curve}
            role="focus"
            seed={5}
          />
        </g>
      )}

      {pickable &&
        layout.buckets.map((b) => (
          <PickRect
            key={`pick-${b.index}`}
            x={b.x}
            y={b.y}
            w={b.w}
            h={b.h}
            rx={6}
            label={`Pick bucket ${b.index}`}
            onActivate={() => onPick?.(b.index)}
          />
        ))}
    </SceneFrame>
  );
}
