/**
 * Pure geometry for the stack scene. No React, no colours.
 *
 * A vertical pile of slabs, bottom item first, inside an open-top container.
 * Slot 0 is the bottom. Capacity ghost slots sit above the top item. The
 * `top` tag sits beside the top slab, and an `incoming` push / pop value is
 * drawn on the right at the level of the first free slot, with an arrow into
 * (push) or out of (pop) that slot.
 *
 * Note targets: `item:<index>` (0 = bottom), `top`, `incoming`.
 */
import type { MarkRole, StackScene } from "@/lib/engine/types";
import type { Point } from "@/lib/stage/sketch";
import type { Box, Density, TargetInfo } from "../layout";

interface Metrics {
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  slabW: number;
  slabH: number;
  gap: number;
  /** Space between the slab and the container wall. */
  wallPad: number;
  /** How far the walls rise above the top slot. */
  wallRise: number;
  /** Room left of the container for index labels and note leaders. */
  gutter: number;
  tagW: number;
  arrowLen: number;
  minSlots: number;
  footer: number;
}

const METRICS: Record<Density, Metrics> = {
  comfortable: {
    baseW: 680,
    padX: 20,
    padTop: 12,
    padBottom: 10,
    slabW: 140,
    slabH: 40,
    gap: 6,
    wallPad: 10,
    wallRise: 10,
    gutter: 48,
    tagW: 44,
    arrowLen: 56,
    minSlots: 4,
    footer: 28,
  },
  compact: {
    baseW: 560,
    padX: 14,
    padTop: 8,
    padBottom: 8,
    slabW: 112,
    slabH: 32,
    gap: 5,
    wallPad: 8,
    wallRise: 8,
    gutter: 40,
    tagW: 40,
    arrowLen: 44,
    minSlots: 3,
    footer: 24,
  },
};

/** Never draw more slots than this; a stack scene is designed for a handful of items. */
const MAX_SLOTS = 24;

export interface StackSlabGeom {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** null for a ghost (capacity) slot. */
  value: number | string | null;
  ghost: boolean;
  marks: MarkRole[];
  isTop: boolean;
}

export interface StackLayout {
  kind: "stack";
  density: Density;
  width: number;
  height: number;
  /** Number of slots drawn (items + ghosts). */
  slots: number;
  slabs: StackSlabGeom[];
  /** Container outline: walls reach `top`, the floor is at `floor`. */
  container: { left: number; right: number; top: number; floor: number };
  /** Right edge of the slabs (where tags and arrows attach). */
  slabRight: number;
  /** Left edge of the slabs. */
  slabLeft: number;
  /** x of the right-aligned index labels. */
  indexX: number;
  /** Tip of the `top` tag (points left at the top slab). Absent when empty. */
  topTag?: { x: number; y: number; box: Box };
  /** An item being pushed or just popped. */
  incoming?: {
    direction: "push" | "pop";
    value: number | string;
    slab: Box;
    from: Point;
    to: Point;
    caption: { x: number; y: number; text: string };
    box: Box;
  };
  footer: { x: number; y: number; text: string };
  /** Where "empty" is written when there are no items. */
  emptyLabel?: { x: number; y: number };
}

export function layoutStack(scene: StackScene, density: Density = "comfortable"): StackLayout {
  const m = METRICS[density];
  const items = scene.items;
  const n = items.length;
  const incoming = scene.incoming ?? null;
  const cap = Number.isFinite(scene.capacity) ? Math.max(0, Math.floor(scene.capacity as number)) : 0;

  // Room for the incoming value's slot, and one ghost above the top when no capacity is given.
  const wanted = Math.max(m.minSlots, cap, n + (incoming ? 1 : cap > 0 ? 0 : 1));
  const slots = Math.min(Math.max(wanted, n), Math.max(MAX_SLOTS, n));

  const pitch = m.slabH + m.gap;
  const containerW = m.slabW + 2 * m.wallPad;
  const rightReach = containerW / 2 + 10 + m.arrowLen + m.slabW;
  const leftReach = containerW / 2 + m.gutter;
  const half = Math.max(rightReach, leftReach);
  const width = Math.max(m.baseW, 2 * (half + m.padX));
  const cx = width / 2;

  const slabX = cx - m.slabW / 2;
  const slabRight = slabX + m.slabW;
  const left = slabX - m.wallPad;
  const right = slabRight + m.wallPad;

  const y0 = m.padTop + m.wallRise;
  const slotTop = (i: number) => y0 + (slots - 1 - i) * pitch;
  const floor = slotTop(0) + m.slabH + 6;

  const marksBy = new Map<number, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    if (!Number.isInteger(mk.index) || mk.index < 0 || mk.index >= n) continue;
    const list = marksBy.get(mk.index) ?? [];
    list.push(mk.role);
    marksBy.set(mk.index, list);
  }

  const slabs: StackSlabGeom[] = [];
  for (let i = 0; i < slots; i++) {
    const ghost = i >= n;
    slabs.push({
      index: i,
      x: slabX,
      y: slotTop(i),
      w: m.slabW,
      h: m.slabH,
      value: ghost ? null : items[i],
      ghost,
      marks: ghost ? [] : (marksBy.get(i) ?? []),
      isTop: i === n - 1,
    });
  }

  let topTag: StackLayout["topTag"];
  if (n > 0) {
    const y = slotTop(n - 1) + m.slabH / 2;
    const x = right + 8;
    topTag = { x, y, box: { x, y: y - 10, w: m.tagW, h: 20 } };
  }

  let inc: StackLayout["incoming"];
  if (incoming && incoming.value !== undefined && incoming.value !== null && n < slots) {
    const direction = incoming.direction === "pop" ? "pop" : "push";
    const sx = right + 10 + m.arrowLen;
    const sy = slotTop(n);
    const midY = sy + m.slabH / 2;
    const slab: Box = { x: sx, y: sy, w: m.slabW, h: m.slabH };
    const gapEnd = 6;
    const inner: Point = { x: slabRight + 3, y: midY };
    const outer: Point = { x: sx - gapEnd, y: midY };
    inc = {
      direction,
      value: incoming.value,
      slab,
      from: direction === "push" ? outer : inner,
      to: direction === "push" ? inner : outer,
      caption: { x: sx + m.slabW / 2, y: sy + m.slabH + 14, text: direction },
      box: { x: inner.x, y: sy, w: sx + m.slabW - inner.x, h: m.slabH + 18 },
    };
  }

  const sizeText = cap > 0 ? `size ${n} / ${Math.max(cap, n)}` : `size ${n}`;
  const labelText = scene.label ? `${scene.label}  ·  ${sizeText}` : sizeText;

  return {
    kind: "stack",
    density,
    width,
    height: floor + m.footer + m.padBottom,
    slots,
    slabs,
    container: { left, right, top: y0 - m.wallRise, floor },
    slabRight,
    slabLeft: slabX,
    indexX: left - 8,
    topTag,
    incoming: inc,
    footer: { x: cx, y: floor + 20, text: labelText },
    emptyLabel: n === 0 ? { x: cx, y: slotTop(0) + m.slabH / 2 } : undefined,
  };
}

/**
 * `item:<index>` (0 = bottom), `top`, `incoming`. Item notes arrive from the
 * left gutter so their leaders never cross the slabs or the push / pop arrow.
 */
export function resolveStackTarget(scene: StackScene, layout: StackLayout, target: string): TargetInfo | null {
  const i = target.indexOf(":");
  const kind = (i < 0 ? target : target.slice(0, i)).trim();
  const id = i < 0 ? "" : target.slice(i + 1).trim();
  const m = METRICS[layout.density];

  if (kind === "item" || kind === "cell") {
    const idx = Number(id);
    const slab = Number.isInteger(idx) ? layout.slabs[idx] : undefined;
    if (!slab || slab.ghost) return null;
    const bx = layout.container.left - m.gutter + 4;
    const box: Box = { x: bx, y: slab.y, w: 20, h: slab.h };
    const n = scene.items.length;
    return {
      x: box.x + box.w / 2,
      y: box.y + box.h / 2,
      box,
      side: idx * 2 >= n - 1 ? "above" : "below",
    };
  }

  if (kind === "top") {
    const t = layout.topTag;
    if (!t) return null;
    return { x: t.box.x + t.box.w / 2, y: t.box.y + t.box.h / 2, box: t.box, side: "below" };
  }

  if (kind === "incoming") {
    const inc = layout.incoming;
    if (!inc) return null;
    const b = inc.slab;
    return { x: b.x + b.w / 2, y: b.y + b.h / 2, box: b, side: "above" };
  }

  return null;
}

function listOf(parts: string[]): string {
  return parts.length ? parts.join("; ") : "none";
}

/** Plain-text description for screen readers. */
export function describeStack(scene: StackScene): string {
  const n = scene.items.length;
  const name = scene.label ? `Stack ${scene.label}` : "Stack";
  const parts: string[] = [];
  if (n === 0) parts.push(`${name} is empty.`);
  else {
    parts.push(`${name} with ${n} item${n === 1 ? "" : "s"}, bottom to top: ${scene.items.join(", ")}.`);
    parts.push(`Top is ${scene.items[n - 1]}.`);
  }
  if (scene.capacity && scene.capacity > 0) parts.push(`Capacity ${scene.capacity}.`);
  if (scene.incoming)
    parts.push(
      scene.incoming.direction === "pop"
        ? `Popped value ${scene.incoming.value}.`
        : `Pushing value ${scene.incoming.value}.`,
    );
  if (scene.marks?.length)
    parts.push(`Marked: ${listOf(scene.marks.map((mk) => `index ${mk.index} ${mk.role}`))}.`);
  if (scene.annotations?.length) parts.push(`Notes: ${listOf(scene.annotations.map((a) => a.text))}.`);
  return parts.join(" ");
}
