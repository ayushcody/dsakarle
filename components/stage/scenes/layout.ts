/**
 * Pure geometry for the scene layouts. No React, no colours.
 *
 * Every scene kind has a `layoutX(scene, density)` that turns data into boxes,
 * points and lane heights (local frame: origin at the top-left of the paper,
 * x grows right, y grows down). The React components only draw what these
 * functions return, and ScenePicture / annotations use `resolveTarget` to find
 * the spot a note should point at.
 *
 * Nothing here is positioned by hand: every x and y comes from the data.
 */
import type {
  Annotation,
  ArrayScene,
  CompositeScene,
  HashMapScene,
  LinkedListScene,
  MarkRole,
  PointerRole,
  Scene,
} from "@/lib/engine/types";
import type { ArrowRole } from "@/lib/stage/semantics";
import type { Point } from "@/lib/stage/sketch";
import { describeTree, layoutTree, resolveTreeTarget, type TreeLayout } from "./kinds/tree";
import { describeGraph, layoutGraph, resolveGraphTarget, type GraphLayout } from "./kinds/graph";
import { describeCallTree, layoutCallTree, resolveCallTreeTarget, type CallTreeLayout } from "./kinds/call-tree";
import { describeStack, layoutStack, resolveStackTarget, type StackLayout } from "./kinds/stack";
import { describeGrid, layoutGrid, resolveGridTarget, type GridLayout } from "./kinds/grid";

export type Density = "comfortable" | "compact";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Constants shared by the layouts
// ---------------------------------------------------------------------------

/** Step between pointer tags that share a spot. Mirrors PointerTag's TAG_STACK. */
export const TAG_STEP = 22;
/** Height a tag occupies above its cell edge (tip gap + triangle + text). */
const TAG_ABOVE = 36;
/** Height a tag occupies below its cell edge (clears the index label). */
const TAG_BELOW = 48;
/** Extra row under the index labels for the address row. */
const ADDR_ROW = 17;
/** How far a window bracket sits below the last lane. */
const BRACKET_DROP = 14;

interface Metrics {
  /** Target viewBox width. */
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  /** Array cells. */
  cellMax: number;
  cellMin: number;
  gap: number;
  /** Space kept clear at each end of an array row for off-the-end pointers. */
  endReserve: number;
  /** Linked-list nodes. */
  nodeW: number;
  nodeH: number;
  linkGap: number;
  nullW: number;
  /** Hash buckets. */
  bucketH: number;
  bucketGap: number;
  chipH: number;
  chipGap: number;
  hashBand: number;
  hashLeft: number;
  noteSize: number;
}

const METRICS: Record<Density, Metrics> = {
  comfortable: {
    baseW: 680,
    padX: 20,
    padTop: 8,
    padBottom: 12,
    cellMax: 64,
    cellMin: 48,
    gap: 8,
    endReserve: 44,
    nodeW: 60,
    nodeH: 42,
    linkGap: 40,
    nullW: 48,
    bucketH: 42,
    bucketGap: 10,
    chipH: 28,
    chipGap: 22,
    hashBand: 44,
    hashLeft: 64,
    noteSize: 19,
  },
  compact: {
    baseW: 560,
    padX: 14,
    padTop: 6,
    padBottom: 8,
    cellMax: 44,
    cellMin: 30,
    gap: 6,
    endReserve: 40,
    nodeW: 48,
    nodeH: 34,
    linkGap: 28,
    nullW: 40,
    bucketH: 34,
    bucketGap: 8,
    chipH: 24,
    chipGap: 16,
    hashBand: 36,
    hashLeft: 52,
    noteSize: 16,
  },
};

/** Linked lists wrap to a second row only past this many nodes per row. */
export const LIST_PER_ROW = 6;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Small deterministic string hash, used as a stable sketch seed. */
export function hashSeed(s: string | number): number {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 997;
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface TagPlacement {
  key: string;
  name: string;
  role: PointerRole;
  /** Centre x of the thing it points at. */
  x: number;
  /** Cell / node edge the tag attaches to (see PointerTag). */
  y: number;
  /** Stack offset (multiple of TAG_STEP). */
  offset: number;
  side: "above" | "below";
  /** Box the tag covers, for annotations that target `ptr:name`. */
  box: Box;
  /** Size of the thing it points at (focus tags draw a ring around it). */
  cellW: number;
  cellH: number;
}

/** What a note's target resolved to. Coordinates are in the layout's local frame. */
export interface TargetInfo {
  /** Centre of the target. */
  x: number;
  y: number;
  box: Box;
  /** Forced side. `inline` = drawn inside the scene (hash buckets). Unset = alternate. */
  side?: "above" | "below" | "inline";
  /** Nudges the leader's tip sideways so it clears a pointer tag at the same x. */
  tipDx?: number;
}

function tagBox(
  side: "above" | "below",
  x: number,
  y: number,
  offset: number,
): Box {
  return side === "above"
    ? { x: x - 22, y: y - 8 - offset - 28, w: 44, h: 28 }
    : { x: x - 22, y: y + 20 + offset, w: 44, h: 28 };
}

function sideOf(role: PointerRole): "above" | "below" {
  return role === "ptrA" ? "below" : "above";
}

/** Gives each tag in a group a stack rank by order of appearance. */
class StackCounter {
  private counts = new Map<string, number>();
  next(group: string): number {
    const n = this.counts.get(group) ?? 0;
    this.counts.set(group, n + 1);
    return n;
  }
  max(side: "above" | "below"): number {
    let best = 0;
    for (const [k, v] of this.counts) if (k.startsWith(`${side}|`)) best = Math.max(best, v);
    return best;
  }
}

function uniqueKey(seen: Map<string, number>, base: string): string {
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}~${n}`;
}

// ---------------------------------------------------------------------------
// Array
// ---------------------------------------------------------------------------

export interface ArrayCellGeom {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  ghost: boolean;
  value: number | string | null;
  marks: MarkRole[];
  address?: number;
}

export interface ArrayLayout {
  kind: "array";
  density: Density;
  width: number;
  height: number;
  cellSize: number;
  pitch: number;
  x0: number;
  cellTop: number;
  cellBottom: number;
  slots: number;
  cells: ArrayCellGeom[];
  label?: { text: string; x: number; y: number };
  addressRow?: { y: number; labelX: number };
  tags: TagPlacement[];
  window?: {
    x1: number;
    x2: number;
    y: number;
    washY: number;
    washH: number;
    box: Box;
  };
}

export function layoutArray(
  scene: ArrayScene,
  density: Density = "comfortable",
): ArrayLayout {
  const m = METRICS[density];
  const n = scene.cells.length;
  const ghosts = Math.max(0, Math.min(24, Math.floor((scene.capacity ?? 0) - n)));
  const slots = Math.max(1, n + ghosts);

  const labelText = scene.label ?? "";
  const labelW = labelText ? labelText.length * 8.6 : 0;
  const left = Math.max(
    m.padX + m.endReserve,
    labelText ? m.padX + 12 + labelW : 0,
  );
  const right = m.padX + m.endReserve;

  const fit = Math.floor((m.baseW - left - right - (slots - 1) * m.gap) / slots);
  const cell = clamp(fit, m.cellMin, m.cellMax);
  const rowW = slots * cell + (slots - 1) * m.gap;
  const width = Math.max(m.baseW, left + right + rowW);
  const x0 = left + (width - left - right - rowW) / 2;
  const pitch = cell + m.gap;

  // Pointers first: their stacking decides how tall the lanes are.
  const counter = new StackCounter();
  const seen = new Map<string, number>();
  const rawTags = (scene.pointers ?? [])
    .filter((p) => Number.isFinite(p.index))
    .map((p) => {
      const idx = clamp(Math.round(p.index), -1, slots);
      const side = sideOf(p.role);
      return {
        key: uniqueKey(seen, p.name),
        name: p.name,
        role: p.role,
        idx,
        side,
        rank: counter.next(`${side}|${idx}`),
      };
    });
  const stackAbove = Math.max(1, counter.max("above"));
  const stackBelow = counter.max("below");

  const win =
    scene.window && Number.isFinite(scene.window.start) && Number.isFinite(scene.window.end)
      ? {
          start: clamp(Math.floor(scene.window.start), 0, slots - 1),
          end: clamp(Math.floor(scene.window.end), 0, slots - 1),
        }
      : null;
  const hasWindow = !!win && win.end >= win.start;

  const aboveLane = TAG_ABOVE + TAG_STEP * (stackAbove - 1);
  const cellTop = m.padTop + aboveLane;
  const cellBottom = cellTop + cell;
  const extra = scene.addresses ? ADDR_ROW : 0;
  const baseY = cellBottom + extra;
  const belowLane =
    stackBelow > 0
      ? TAG_BELOW + TAG_STEP * (stackBelow - 1)
      : hasWindow && rawTags.length > 0
        ? TAG_BELOW
        : 0;

  const bracketY = baseY + (belowLane || 22) + BRACKET_DROP;
  const contentBottom = hasWindow
    ? bracketY + 6
    : Math.max(baseY + 22, baseY + belowLane);
  const height = contentBottom + m.padBottom;

  const marksBy = new Map<number, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    const list = marksBy.get(mk.index) ?? [];
    list.push(mk.role);
    marksBy.set(mk.index, list);
  }

  const cells: ArrayCellGeom[] = [];
  for (let i = 0; i < slots; i++) {
    const ghost = i >= n;
    cells.push({
      index: i,
      x: x0 + i * pitch,
      y: cellTop,
      w: cell,
      h: cell,
      ghost,
      value: ghost ? null : scene.cells[i],
      marks: ghost ? [] : (marksBy.get(i) ?? []),
      address: scene.addresses
        ? scene.addresses.base + i * scene.addresses.size
        : undefined,
    });
  }

  const tags: TagPlacement[] = rawTags.map((t) => {
    const x = x0 + t.idx * pitch + cell / 2;
    const y = t.side === "below" ? baseY : cellTop;
    const offset = t.rank * TAG_STEP;
    return {
      key: t.key,
      name: t.name,
      role: t.role,
      x,
      y,
      offset,
      side: t.side,
      box: tagBox(t.side, x, y, offset),
      cellW: cell,
      cellH: cell,
    };
  });

  return {
    kind: "array",
    density,
    width,
    height,
    cellSize: cell,
    pitch,
    x0,
    cellTop,
    cellBottom,
    slots,
    cells,
    label: labelText
      ? { text: labelText, x: x0 - 12, y: cellTop + cell / 2 }
      : undefined,
    addressRow: scene.addresses
      ? { y: cellBottom + 33, labelX: x0 - 12 }
      : undefined,
    tags,
    window: hasWindow
      ? {
          x1: x0 + win.start * pitch,
          x2: x0 + win.end * pitch + cell,
          y: bracketY,
          washY: cellTop - 6,
          washH: cell + 12,
          box: {
            x: x0 + win.start * pitch,
            y: cellTop,
            w: (win.end - win.start) * pitch + cell,
            h: bracketY + 6 - cellTop,
          },
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Linked list
// ---------------------------------------------------------------------------

export interface ListNodeGeom {
  id: string;
  value: number | string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  row: number;
  col: number;
  floating: boolean;
  marks: MarkRole[];
}

export interface LinkGeom {
  key: string;
  from: Point;
  to: Point;
  curve: number;
  role: ArrowRole;
  seed: number;
}

export interface LinkedListLayout {
  kind: "linked-list";
  density: Density;
  width: number;
  height: number;
  nodes: ListNodeGeom[];
  nullBox?: { cx: number; cy: number; w: number; h: number; row: number; col: number };
  links: LinkGeom[];
  tags: TagPlacement[];
  rows: number;
}

const NODE_PORT_DX = 18;
const NODE_GAP = 3;

export function layoutLinkedList(
  scene: LinkedListScene,
  density: Density = "comfortable",
): LinkedListLayout {
  const m = METRICS[density];
  const floatSet = new Set(scene.floating ?? []);
  const known = new Set(scene.nodes.map((n) => n.id));
  const main = scene.nodes.filter((n) => !floatSet.has(n.id));
  const floats = scene.nodes.filter((n) => floatSet.has(n.id));

  const rows = Math.max(1, Math.ceil(main.length / LIST_PER_ROW));
  const perRow = Math.max(1, Math.ceil(main.length / rows));
  const pitch = m.nodeW + m.linkGap;

  const colsInRow = (r: number) =>
    Math.max(0, Math.min(perRow, main.length - r * perRow));
  const lastCols = colsInRow(rows - 1);
  const rowWidth = (r: number) => {
    const c = colsInRow(r);
    const nodesW = c > 0 ? c * m.nodeW + (c - 1) * m.linkGap : 0;
    return r === rows - 1
      ? nodesW + (c > 0 ? m.linkGap : 0) + m.nullW
      : nodesW;
  };
  let maxRowW = 0;
  for (let r = 0; r < rows; r++) maxRowW = Math.max(maxRowW, rowWidth(r));
  const width = Math.max(m.baseW, maxRowW + 2 * m.padX);
  const x0 = (width - maxRowW) / 2;

  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    const list = marksBy.get(mk.id) ?? [];
    list.push(mk.role);
    marksBy.set(mk.id, list);
  }

  // --- x positions (y comes later, once lane heights are known) -------------
  const geom = new Map<string, ListNodeGeom>();
  main.forEach((n, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    geom.set(n.id, {
      id: n.id,
      value: n.value,
      cx: x0 + col * pitch + m.nodeW / 2,
      cy: 0,
      w: m.nodeW,
      h: m.nodeH,
      row,
      col,
      floating: false,
      marks: marksBy.get(n.id) ?? [],
    });
  });
  const nullCol = lastCols;
  const nullBox = {
    cx: x0 + nullCol * pitch + m.nullW / 2,
    cy: 0,
    w: m.nullW,
    h: m.nodeH,
    row: rows - 1,
    col: nullCol,
  };
  const usesNull = scene.links.some((l) => l.to === null) || main.length === 0 ||
    (scene.pointers ?? []).some((p) => p.target === null);

  // Floating nodes sit where they will be inserted: between the node that will
  // point at them and the node they point at.
  const floatRow = floats.length > 0 ? rows : -1;
  const xOfTarget = (id: string | null): number | null => {
    if (id === null) return nullBox.cx;
    return geom.get(id)?.cx ?? null;
  };
  const desired = floats.map((f) => {
    const out = scene.links.find((l) => l.from === f.id);
    const into = scene.links.find((l) => l.to === f.id && !floatSet.has(l.from));
    let x: number | null = null;
    if (out) {
      const tx = xOfTarget(out.to);
      if (tx !== null) x = tx - pitch / 2;
    }
    if (x === null && into) {
      const sx = geom.get(into.from)?.cx;
      if (sx !== undefined) x = sx + pitch / 2;
    }
    return { node: f, x: x ?? width / 2 };
  });
  desired.sort((a, b) => a.x - b.x);
  const minX = m.padX + m.nodeW / 2;
  const maxX = width - m.padX - m.nodeW / 2;
  const sep = m.nodeW + 16;
  const placedX: number[] = [];
  desired.forEach((d, i) => {
    let x = clamp(d.x, minX, maxX);
    if (i > 0) x = Math.max(x, placedX[i - 1] + sep);
    placedX.push(x);
  });
  for (let i = placedX.length - 1; i >= 0; i--) {
    const cap = i === placedX.length - 1 ? maxX : placedX[i + 1] - sep;
    placedX[i] = Math.min(placedX[i], cap);
  }
  desired.forEach((d, i) => {
    geom.set(d.node.id, {
      id: d.node.id,
      value: d.node.value,
      cx: placedX[i],
      cy: 0,
      w: m.nodeW,
      h: m.nodeH,
      row: floatRow,
      col: i,
      floating: true,
      marks: marksBy.get(d.node.id) ?? [],
    });
  });

  // --- links: classify to size the arc lanes --------------------------------
  type RawLink = {
    from: string;
    to: string | null;
    role: ArrowRole;
    kind: "straight" | "arc" | "cross";
    arcB: number;
  };
  const rawLinks: RawLink[] = [];
  for (const l of scene.links) {
    const a = geom.get(l.from);
    if (!a) continue;
    if (l.to !== null && !known.has(l.to)) continue;
    const b = l.to === null ? null : geom.get(l.to);
    if (l.to !== null && !b) continue;
    const bRow = b ? b.row : nullBox.row;
    const bCol = b ? b.col : nullBox.col;
    const bFloating = b ? b.floating : false;
    const role: ArrowRole = l.role ?? "neutral";
    if (!a.floating && !bFloating && a.row === bRow) {
      const dc = bCol - a.col;
      if (dc === 1) rawLinks.push({ from: l.from, to: l.to, role, kind: "straight", arcB: 0 });
      else {
        const len = Math.max(1, Math.abs(dc) * pitch - 2 * NODE_PORT_DX);
        const B = Math.min(30 + 0.16 * len, 84);
        rawLinks.push({ from: l.from, to: l.to, role, kind: "arc", arcB: B });
      }
    } else {
      rawLinks.push({ from: l.from, to: l.to, role, kind: "cross", arcB: 0 });
    }
  }

  // --- pointers: stack ranks decide the lane heights ------------------------
  const counter = new StackCounter();
  const aboveStack = new Map<number, number>();
  const belowStack = new Map<number, number>();
  const seenTag = new Map<string, number>();
  const rawTags = (scene.pointers ?? [])
    .map((p) => {
      const g = p.target === null ? null : geom.get(p.target);
      if (p.target !== null && !g) return null;
      const row = g ? g.row : nullBox.row;
      const cx = g ? g.cx : nullBox.cx;
      const w = g ? g.w : nullBox.w;
      const side = sideOf(p.role);
      const rank = counter.next(`${side}|${row}|${p.target ?? "null"}`);
      const map = side === "above" ? aboveStack : belowStack;
      map.set(row, Math.max(map.get(row) ?? 0, rank + 1));
      return {
        key: uniqueKey(seenTag, p.name),
        name: p.name,
        role: p.role,
        row,
        cx,
        w,
        side,
        rank,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  // --- y positions: lanes per row -------------------------------------------
  const totalRows = rows + (floats.length > 0 ? 1 : 0);
  const arcByRow = new Map<number, number>();
  for (const l of rawLinks) {
    if (l.kind !== "arc") continue;
    const row = geom.get(l.from)!.row;
    arcByRow.set(row, Math.max(arcByRow.get(row) ?? 0, l.arcB));
  }
  const rowCy: number[] = [];
  let y = m.padTop;
  for (let r = 0; r < totalRows; r++) {
    const stackUp = Math.max(1, aboveStack.get(r) ?? 0);
    const tagLane = TAG_ABOVE + TAG_STEP * (stackUp - 1);
    const arc = arcByRow.get(r);
    const above = Math.max(tagLane, arc ? arc + 12 : 0);
    const nodeTop = y + above;
    rowCy.push(nodeTop + m.nodeH / 2);
    const stackDown = belowStack.get(r) ?? 0;
    const belowLane = stackDown > 0 ? TAG_BELOW + 2 + TAG_STEP * (stackDown - 1) : 24;
    y = nodeTop + m.nodeH + belowLane + (r < totalRows - 1 ? 18 : 0);
  }
  const height = y + m.padBottom;

  for (const g of geom.values()) g.cy = rowCy[g.row];
  nullBox.cy = rowCy[nullBox.row];

  // --- link geometry ---------------------------------------------------------
  const seenLink = new Map<string, number>();
  const links: LinkGeom[] = rawLinks.map((l) => {
    const a = geom.get(l.from)!;
    const b = l.to === null ? null : geom.get(l.to)!;
    const bcx = b ? b.cx : nullBox.cx;
    const bcy = b ? b.cy : nullBox.cy;
    const bw = b ? b.w : nullBox.w;
    const bh = b ? b.h : nullBox.h;
    let from: Point;
    let to: Point;
    let curve = 0;
    if (l.kind === "straight") {
      from = { x: a.cx + a.w / 2 + NODE_GAP, y: a.cy };
      to = { x: bcx - bw / 2 - NODE_GAP, y: bcy };
    } else if (l.kind === "arc") {
      const dir = bcx > a.cx ? 1 : -1;
      from = { x: a.cx + dir * NODE_PORT_DX, y: a.cy - a.h / 2 - NODE_GAP };
      to = { x: bcx - dir * NODE_PORT_DX, y: bcy - bh / 2 - NODE_GAP };
      const len = Math.max(1, Math.abs(to.x - from.x));
      curve = (dir > 0 ? -1 : 1) * Math.min(0.9, l.arcB / len);
    } else {
      const goingDown = bcy > a.cy;
      const dir = bcx >= a.cx ? 1 : -1;
      from = {
        x: a.cx + dir * NODE_PORT_DX,
        y: a.cy + (goingDown ? 1 : -1) * (a.h / 2 + NODE_GAP + 1),
      };
      to = {
        x: bcx - dir * NODE_PORT_DX,
        y: bcy + (goingDown ? -1 : 1) * (bh / 2 + NODE_GAP + 1),
      };
    }
    return {
      key: uniqueKey(seenLink, `link-${l.from}`),
      from,
      to,
      curve,
      role: l.role,
      seed: hashSeed(l.from) + 3,
    };
  });

  const tags: TagPlacement[] = rawTags.map((t) => {
    const cy = rowCy[t.row];
    const y0 = t.side === "below" ? cy + m.nodeH / 2 : cy - m.nodeH / 2;
    const offset = t.rank * TAG_STEP;
    return {
      key: t.key,
      name: t.name,
      role: t.role,
      x: t.cx,
      y: y0,
      offset,
      side: t.side,
      box: tagBox(t.side, t.cx, y0, offset),
      cellW: t.w,
      cellH: m.nodeH,
    };
  });

  return {
    kind: "linked-list",
    density,
    width,
    height,
    nodes: [...geom.values()],
    nullBox: usesNull ? nullBox : undefined,
    links,
    tags,
    rows: totalRows,
  };
}

// ---------------------------------------------------------------------------
// Hash map
// ---------------------------------------------------------------------------

export interface HashEntryGeom {
  key: string;
  label: string;
  bucket: number;
  slot: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  marks: MarkRole[];
}

export interface HashLayout {
  kind: "hash-map";
  density: Density;
  width: number;
  height: number;
  x0: number;
  bucketW: number;
  bucketH: number;
  buckets: Array<{ index: number; x: number; y: number; w: number; h: number; marks: MarkRole[] }>;
  entries: HashEntryGeom[];
  chains: Array<{ key: string; from: Point; to: Point }>;
  hashing?: {
    x: number;
    y: number;
    keyText: string;
    hashText: string;
    modText: string;
    bucketText: string;
    arrow: { from: Point; to: Point; curve: number };
  };
  /** Chip text size. */
  chipFont: number;
}

function quote(key: number | string): string {
  return typeof key === "string" ? `"${key}"` : String(key);
}

export function layoutHashMap(
  scene: HashMapScene,
  density: Density = "comfortable",
): HashLayout {
  const m = METRICS[density];
  const mBuckets = scene.buckets.length;
  const chipFont = density === "compact" ? 11 : 13;
  const charW = chipFont * 0.62;

  const chipW = (label: string) => clamp(label.length * charW + 20, 44, 130);
  const chipPad = 10;

  // Chain geometry (relative to the bucket's left edge) and the widest chain.
  const labels = scene.buckets.map((b) =>
    b.map((e) =>
      e.value === undefined ? String(e.key) : `${e.key}:${e.value}`,
    ),
  );
  let widest = 0;
  for (const row of labels) {
    let w = chipPad;
    row.forEach((l, i) => {
      w += chipW(l) + (i < row.length - 1 ? m.chipGap : 0);
    });
    widest = Math.max(widest, w + chipPad);
  }
  const x0 = m.hashLeft;
  const bucketW = Math.max(m.baseW - x0 - m.padX, widest + 8);
  const width = x0 + bucketW + m.padX;

  const hasHashing = scene.hashing !== undefined;
  const top = m.padTop + (hasHashing ? m.hashBand : 4);
  const pitch = m.bucketH + m.bucketGap;

  const bucketMarks = new Map<number, MarkRole[]>();
  const slotMarks = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    if (mk.slot === undefined) {
      const list = bucketMarks.get(mk.bucket) ?? [];
      list.push(mk.role);
      bucketMarks.set(mk.bucket, list);
    } else {
      const k = `${mk.bucket}:${mk.slot}`;
      const list = slotMarks.get(k) ?? [];
      list.push(mk.role);
      slotMarks.set(k, list);
    }
  }

  const buckets = scene.buckets.map((_, i) => ({
    index: i,
    x: x0,
    y: top + i * pitch,
    w: bucketW,
    h: m.bucketH,
    marks: bucketMarks.get(i) ?? [],
  }));

  const entries: HashEntryGeom[] = [];
  const chains: HashLayout["chains"] = [];
  const seenKeys = new Map<string, number>();
  scene.buckets.forEach((chain, b) => {
    let cursor = x0 + chipPad;
    const cy = top + b * pitch + m.bucketH / 2;
    let prev: HashEntryGeom | null = null;
    chain.forEach((e, slot) => {
      const label = labels[b][slot];
      const w = chipW(label);
      const geom: HashEntryGeom = {
        key: uniqueKey(seenKeys, `entry-${e.key}`),
        label,
        bucket: b,
        slot,
        cx: cursor + w / 2,
        cy,
        w,
        h: m.chipH,
        marks: slotMarks.get(`${b}:${slot}`) ?? [],
      };
      entries.push(geom);
      if (prev) {
        chains.push({
          key: `chain-${geom.key}`,
          from: { x: prev.cx + prev.w / 2 + 2, y: cy },
          to: { x: geom.cx - w / 2 - 3, y: cy },
        });
      }
      prev = geom;
      cursor += w + m.chipGap;
    });
  });

  let hashing: HashLayout["hashing"];
  if (scene.hashing) {
    const { key, hash, bucket } = scene.hashing;
    const ty = m.padTop + 20;
    const target = buckets[clamp(bucket, 0, Math.max(0, mBuckets - 1))];
    const from: Point = { x: x0 - 40, y: ty + 8 };
    const to: Point = {
      x: x0 - 30,
      y: target ? target.y + target.h / 2 : ty + 30,
    };
    const len = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    hashing = {
      x: x0,
      y: ty,
      keyText: quote(key),
      hashText: `hash = ${hash}`,
      modText: `${hash} % ${mBuckets}`,
      bucketText: `${bucket}`,
      arrow: { from, to, curve: Math.min(0.3, 16 / len) },
    };
  }

  return {
    kind: "hash-map",
    density,
    width,
    height: top + Math.max(0, mBuckets) * pitch - (mBuckets > 0 ? m.bucketGap : 0) + m.padBottom + 4,
    x0,
    bucketW,
    bucketH: m.bucketH,
    buckets,
    entries,
    chains,
    hashing,
    chipFont,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export type SceneLayout =
  | ArrayLayout
  | LinkedListLayout
  | HashLayout
  | TreeLayout
  | GraphLayout
  | CallTreeLayout
  | StackLayout
  | GridLayout
  | { kind: "composite" };

export function layoutScene(
  scene: Scene,
  density: Density = "comfortable",
): SceneLayout {
  switch (scene.kind) {
    case "array":
      return layoutArray(scene, density);
    case "linked-list":
      return layoutLinkedList(scene, density);
    case "hash-map":
      return layoutHashMap(scene, density);
    case "tree":
      return layoutTree(scene, density);
    case "graph":
      return layoutGraph(scene, density);
    case "call-tree":
      return layoutCallTree(scene, density);
    case "stack":
      return layoutStack(scene, density);
    case "grid":
      return layoutGrid(scene, density);
    case "composite":
      return { kind: "composite" };
  }
}

// ---------------------------------------------------------------------------
// Annotation targets
// ---------------------------------------------------------------------------

function parseTarget(target: string): { kind: string; id: string } {
  const i = target.indexOf(":");
  return i < 0
    ? { kind: target.trim(), id: "" }
    : { kind: target.slice(0, i).trim(), id: target.slice(i + 1).trim() };
}

function centreOf(box: Box): { x: number; y: number } {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

/**
 * Where does a note's target live in this layout? Returns null for targets the
 * scene does not contain (the note is then dropped). Syntax is the same as
 * `Annotation.target`: `cell:3`, `node:n2`, `bucket:1`, `ptr:left`, `window`.
 */
export function resolveTarget(
  scene: Scene,
  layout: SceneLayout,
  target: string,
): TargetInfo | null {
  const { kind, id } = parseTarget(target);
  if (layout.kind === "tree" && scene.kind === "tree") return resolveTreeTarget(scene, layout, target);
  if (layout.kind === "graph" && scene.kind === "graph") return resolveGraphTarget(scene, layout, target);
  if (layout.kind === "call-tree" && scene.kind === "call-tree") return resolveCallTreeTarget(scene, layout, target);
  if (layout.kind === "stack" && scene.kind === "stack") return resolveStackTarget(scene, layout, target);
  if (layout.kind === "grid" && scene.kind === "grid") return resolveGridTarget(scene, layout, target);

  if (layout.kind === "array") {
    if (kind === "window") {
      const w = layout.window;
      return w ? { ...centreOf(w.box), box: w.box, side: "below" } : null;
    }
    if (kind === "ptr") {
      const t = layout.tags.find((p) => p.name === id);
      return t ? { ...centreOf(t.box), box: t.box, side: t.side } : null;
    }
    if (kind === "cell") {
      const i = Number(id);
      const c = layout.cells[i];
      if (!Number.isInteger(i) || !c) return null;
      const extra = layout.addressRow ? ADDR_ROW : 0;
      const box: Box = { x: c.x, y: c.y, w: c.w, h: c.h + 20 + extra };
      const cx = c.x + c.w / 2;
      const tagAt = (side: "above" | "below") =>
        layout.tags.some((t) => t.side === side && Math.abs(t.x - cx) < 1);
      return {
        ...centreOf(box),
        box,
        tipDx: tagAt("above") || tagAt("below") ? c.w * 0.3 : 0,
      };
    }
    return null;
  }

  if (layout.kind === "linked-list") {
    if (kind === "ptr") {
      const t = layout.tags.find((p) => p.name === id);
      return t ? { ...centreOf(t.box), box: t.box, side: t.side } : null;
    }
    if (kind === "node" || kind === "cell") {
      if (id === "null" && layout.nullBox) {
        const b = layout.nullBox;
        const box: Box = { x: b.cx - b.w / 2, y: b.cy - b.h / 2, w: b.w, h: b.h };
        return { ...centreOf(box), box };
      }
      const n = layout.nodes.find((g) => g.id === id);
      if (!n) return null;
      const box: Box = { x: n.cx - n.w / 2, y: n.cy - n.h / 2, w: n.w, h: n.h + 20 };
      const tagAt = (side: "above" | "below") =>
        layout.tags.some((t) => t.side === side && Math.abs(t.x - n.cx) < 1 && Math.abs(t.y - (side === "above" ? n.cy - n.h / 2 : n.cy + n.h / 2)) < 1);
      return {
        ...centreOf(box),
        box,
        side: n.floating ? "below" : undefined,
        tipDx: tagAt("above") || tagAt("below") ? n.w * 0.3 : 0,
      };
    }
    return null;
  }

  if (layout.kind === "hash-map") {
    if (kind === "bucket" || kind === "cell") {
      const i = Number(id);
      const b = layout.buckets[i];
      if (!Number.isInteger(i) || !b) return null;
      return { ...centreOf(b), box: { x: b.x, y: b.y, w: b.w, h: b.h }, side: "inline" };
    }
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Notes (handwritten annotations / picture callouts)
// ---------------------------------------------------------------------------

export interface PlacedNote {
  key: string;
  text: string;
  x: number;
  y: number;
  align: "start" | "middle" | "end";
  /** Where the leader touches, in the outer frame. Undefined = no leader. */
  tip?: Point;
}

export interface NotePlan {
  /** Height reserved above the layout for notes. */
  top: number;
  /** Height reserved below the layout for notes. */
  bottom: number;
  fontSize: number;
  items: PlacedNote[];
}

export const EMPTY_PLAN: NotePlan = { top: 0, bottom: 0, fontSize: 19, items: [] };

/**
 * Lays notes out in bands above and below the scene: notes alternate
 * above / below unless their target forces a side (pointer tags, windows,
 * floating nodes), and a note that would overlap another in its band moves to
 * a new row. Returned coordinates are in the outer frame (the layout is drawn
 * translated down by `top`).
 */
export function planNotes(
  scene: Scene,
  layout: SceneLayout,
  notes: readonly Annotation[],
  density: Density,
  opts: { minTopRows?: number } = {},
): NotePlan {
  const fs = METRICS[density].noteSize;
  const lh = fs * 1.05;
  if (layout.kind === "composite") return { ...EMPTY_PLAN, fontSize: fs };

  type Item = {
    note: Annotation;
    index: number;
    info: TargetInfo;
    side: "above" | "below" | "inline";
    row: number;
    cx: number;
    wEst: number;
    lines: number;
  };
  const items: Item[] = [];
  let auto = 0;
  const aboveRows: Array<Array<[number, number]>> = [];
  const belowRows: Array<Array<[number, number]>> = [];

  notes.forEach((note, index) => {
    const info = resolveTarget(scene, layout, note.target);
    if (!info) return;
    const lines = note.text.split("\n");
    const wEst = Math.max(...lines.map((l) => l.length)) * fs * 0.42 + 8;
    const side = info.side ?? (auto++ % 2 === 0 ? "above" : "below");
    const cx = clamp(info.x, wEst / 2 + 8, Math.max(wEst / 2 + 8, layout.width - wEst / 2 - 8));
    let row = 0;
    if (side !== "inline") {
      const rows = side === "above" ? aboveRows : belowRows;
      row = rows.findIndex((r) =>
        r.every(([l, rr]) => cx + wEst / 2 + 10 < l || cx - wEst / 2 - 10 > rr),
      );
      if (row < 0) {
        rows.push([]);
        row = rows.length - 1;
      }
      rows[row].push([cx - wEst / 2, cx + wEst / 2]);
    }
    items.push({ note, index, info, side, row, cx, wEst, lines: lines.length });
  });

  const maxLines = Math.max(1, ...items.map((i) => i.lines));
  const rowH = maxLines * lh + 14;
  const top = Math.max((opts.minTopRows ?? 0) * rowH, aboveRows.length * rowH);
  const bottom = belowRows.length * rowH;

  const placed: PlacedNote[] = items.map((it) => {
    const key = `note-${it.index}-${it.note.target}-${it.note.text}`;
    const text = it.note.text;
    if (it.side === "inline") {
      const b = it.info.box;
      return {
        key,
        text,
        x: b.x + b.w - 14,
        y: b.y + top + b.h / 2 + fs * 0.3,
        align: "end",
      };
    }
    const tipX = it.info.x + (it.info.tipDx ?? 0);
    if (it.side === "above") {
      return {
        key,
        text,
        x: it.cx,
        y: top - 8 - it.row * rowH - (it.lines - 1) * lh,
        align: "middle",
        tip: { x: tipX, y: it.info.box.y + top - 3 },
      };
    }
    return {
      key,
      text,
      x: it.cx,
      y: top + layout.height + it.row * rowH + fs + 4,
      align: "middle",
      tip: { x: tipX, y: it.info.box.y + it.info.box.h + top + 3 },
    };
  });

  return { top, bottom, fontSize: fs, items: placed };
}

/**
 * For a composite picture: which part should draw each callout? A callout may
 * name its part with a `p<i>:` prefix; otherwise the first part whose layout
 * can resolve the target gets it.
 */
export function assignNotesToParts(
  parts: CompositeScene["parts"],
  notes: readonly Annotation[],
  density: Density,
): Annotation[][] {
  const out: Annotation[][] = parts.map(() => []);
  if (notes.length === 0) return out;
  const layouts = parts.map((p) => layoutScene(p.scene, density));
  for (const note of notes) {
    const m = /^p(\d+):(.*)$/.exec(note.target);
    if (m) {
      const i = Number(m[1]);
      if (parts[i]) out[i].push({ ...note, target: m[2] });
      continue;
    }
    const i = parts.findIndex((p, idx) =>
      resolveTarget(p.scene, layouts[idx], note.target) !== null,
    );
    if (i >= 0) out[i].push(note);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Screen-reader summaries
// ---------------------------------------------------------------------------

function list(items: string[]): string {
  return items.length ? items.join("; ") : "none";
}

/** Plain-text description of a scene: values, pointers, marks, notes. */
export function describeScene(scene: Scene): string {
  switch (scene.kind) {
    case "tree":
      return describeTree(scene);
    case "graph":
      return describeGraph(scene);
    case "call-tree":
      return describeCallTree(scene);
    case "stack":
      return describeStack(scene);
    case "grid":
      return describeGrid(scene);
    case "array": {
      const vals = scene.cells.map((c) => (c === null ? "empty" : String(c)));
      const parts = [
        `Array${scene.label ? ` ${scene.label}` : ""} with ${scene.cells.length} slot${scene.cells.length === 1 ? "" : "s"}: ${vals.join(", ")}.`,
      ];
      if (scene.capacity && scene.capacity > scene.cells.length)
        parts.push(`Capacity ${scene.capacity}.`);
      if (scene.pointers?.length)
        parts.push(
          `Pointers: ${list(scene.pointers.map((p) => `${p.name} at index ${p.index}`))}.`,
        );
      if (scene.window)
        parts.push(`Window from index ${scene.window.start} to ${scene.window.end}.`);
      if (scene.marks?.length)
        parts.push(
          `Marked: ${list(scene.marks.map((mk) => `index ${mk.index} ${mk.role}`))}.`,
        );
      if (scene.annotations?.length)
        parts.push(`Notes: ${list(scene.annotations.map((a) => a.text))}.`);
      return parts.join(" ");
    }
    case "linked-list": {
      const label = (id: string | null) => (id === null ? "null" : id);
      const parts = [
        `Linked list: ${scene.nodes.map((n) => `${n.id} holds ${n.value}`).join(", ") || "empty"}.`,
      ];
      if (scene.links.length)
        parts.push(
          `Links: ${list(scene.links.map((l) => `${l.from} points to ${label(l.to)}`))}.`,
        );
      if (scene.floating?.length)
        parts.push(`Not yet linked in: ${scene.floating.join(", ")}.`);
      if (scene.pointers?.length)
        parts.push(
          `Pointers: ${list(scene.pointers.map((p) => `${p.name} at ${label(p.target)}`))}.`,
        );
      if (scene.marks?.length)
        parts.push(`Marked: ${list(scene.marks.map((mk) => `${mk.id} ${mk.role}`))}.`);
      if (scene.annotations?.length)
        parts.push(`Notes: ${list(scene.annotations.map((a) => a.text))}.`);
      return parts.join(" ");
    }
    case "hash-map": {
      const rows = scene.buckets.map(
        (b, i) =>
          `bucket ${i} ${b.length ? b.map((e) => (e.value === undefined ? String(e.key) : `${e.key} maps to ${e.value}`)).join(", ") : "empty"}`,
      );
      const parts = [`Hash map with ${scene.buckets.length} buckets: ${rows.join("; ")}.`];
      if (scene.hashing)
        parts.push(
          `Hashing ${scene.hashing.key}: hash ${scene.hashing.hash}, bucket ${scene.hashing.bucket}.`,
        );
      if (scene.marks?.length)
        parts.push(
          `Marked: ${list(scene.marks.map((mk) => `bucket ${mk.bucket}${mk.slot !== undefined ? ` slot ${mk.slot}` : ""} ${mk.role}`))}.`,
        );
      if (scene.annotations?.length)
        parts.push(`Notes: ${list(scene.annotations.map((a) => a.text))}.`);
      return parts.join(" ");
    }
    case "composite":
      return scene.parts
        .map((p, i) => `${p.title ?? `Part ${i + 1}`}: ${describeScene(p.scene)}`)
        .join(" ");
  }
}
