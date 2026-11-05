"use client";

import { useMemo } from "react";
import type { ArrayScene as ArrayData } from "@/lib/engine/types";
import { Cell, PointerTag, RangeBracket } from "@/components/stage/primitives";
import { FONT_MONO, SURFACE } from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "./SceneFrame";
import { describeScene, layoutArray, planNotes } from "./layout";

/** Array: indexed cells, pointer tags, a window bracket, ghost capacity and an optional address row. */
export function ArrayScene({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  ariaLabel,
  className,
  notes,
  minNoteRows = 0,
}: SceneKindProps<ArrayData>) {
  const layout = useMemo(() => layoutArray(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeScene(scene), [scene]);
  const w = layout.window;

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
      {/* The window goes first so its tint sits behind the cells. */}
      {w && (
        <RangeBracket
          x1={w.x1}
          x2={w.x2}
          y={w.y}
          side="below"
          washY={w.washY}
          washH={w.washH}
        />
      )}

      {layout.label && (
        <text
          x={layout.label.x}
          y={layout.label.y}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={density === "compact" ? 12 : 14}
          fontWeight={600}
          style={{ fill: SURFACE.ink2, fontFamily: FONT_MONO }}
        >
          {layout.label.text}
        </text>
      )}

      {layout.cells.map((c) => (
        <Cell
          key={`cell-${c.index}`}
          x={c.x}
          y={c.y}
          w={c.w}
          h={c.h}
          value={c.value}
          index={c.index}
          marks={c.marks}
          seed={c.index + 1}
          ghost={c.ghost}
        />
      ))}

      {layout.addressRow && (
        <g aria-hidden="true">
          <text
            x={layout.addressRow.labelX}
            y={layout.addressRow.y}
            textAnchor="end"
            fontSize={10.5}
            style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
          >
            addr
          </text>
          {layout.cells.map((c) => (
            <text
              key={`addr-${c.index}`}
              x={c.x + c.w / 2}
              y={layout.addressRow!.y}
              textAnchor="middle"
              fontSize={10.5}
              style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
            >
              {c.address}
            </text>
          ))}
        </g>
      )}

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
        layout.cells
          .filter((c) => !c.ghost)
          .map((c) => (
            <PickRect
              key={`pick-${c.index}`}
              x={c.x}
              y={c.y}
              w={c.w}
              h={c.h}
              rx={6}
              label={`Pick index ${c.index}${c.value === null ? ", empty" : `, value ${c.value}`}`}
              onActivate={() => onPick?.(c.index)}
            />
          ))}
    </SceneFrame>
  );
}
