/**
 * Pure geometry for the call-tree scene. No React, no colours.
 *
 * Calls are laid out top-down by depth. A parent sits centred over the span of
 * its children, and each subtree claims the width of its own chips, so the
 * calls read left to right in call order. A compact "call stack" pile (bottom
 * to top) sits on the right, standing on the same baseline as the tree.
 *
 * Note targets: `call:<id>`, `stack`.
 */
import type { CallTreeScene, MarkRole } from "@/lib/engine/types";
import type { Point } from "@/lib/stage/sketch";
import type { Box, Density, TargetInfo } from "../layout";

interface Metrics {
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  chipH: number;
  chipMinW: number;
  chipMaxW: number;
  chipGap: number;
  levelGap: number;
  font: number;
  resultFont: number;
  /** Width of one mono glyph at `font`. */
  charW: number;
  /** Call-stack pile. */
  boxH: number;
  boxGap: number;
  colMinW: number;
  colMaxW: number;
  colGap: number;
  header: number;
  maxChars: number;
}

const METRICS: Record<Density, Metrics> = {
  comfortable: {
    baseW: 680,
    padX: 20,
    padTop: 10,
    padBottom: 12,
    chipH: 44,
    chipMinW: 64,
    chipMaxW: 184,
    chipGap: 14,
    levelGap: 34,
    font: 12,
    resultFont: 12,
    charW: 7.2,
    boxH: 26,
    boxGap: 4,
    colMinW: 92,
    colMaxW: 176,
    colGap: 34,
    header: 24,
    maxChars: 24,
  },
  compact: {
    baseW: 560,
    padX: 14,
    padTop: 8,
    padBottom: 8,
    chipH: 38,
    chipMinW: 54,
    chipMaxW: 150,
    chipGap: 10,
    levelGap: 26,
    font: 11,
    resultFont: 10.5,
    charW: 6.6,
    boxH: 22,
    boxGap: 3,
    colMinW: 78,
    colMaxW: 146,
    colGap: 26,
    header: 20,
    maxChars: 20,
  },
};

export type CallStatus = CallTreeScene["calls"][number]["status"];

export interface CallChipGeom {
  id: string;
  /** Display label (shortened if long). */
  label: string;
  /** Full label for screen readers. */
  full: string;
  /** Top-left and size. */
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  depth: number;
  status: CallStatus;
  /** Second line once returned, e.g. `= 2` or `✓ [1,2]`. */
  result: string | null;
  resultTone: "plain" | "ok" | "bad";
  marks: MarkRole[];
  parent: string | null;
  /** On the live call stack. */
  live: boolean;
  /** The top of the live call stack. */
  top: boolean;
}

export interface CallEdgeGeom {
  key: string;
  parent: string;
  child: string;
  from: Point;
  to: Point;
  tone: "live" | "done" | "pending" | "pruned";
}

export interface CallStackBoxGeom {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  top: boolean;
}

export interface CallStackColumn {
  box: Box;
  header: { x: number; y: number; text: string };
  boxes: CallStackBoxGeom[];
  floor: { x1: number; x2: number; y: number };
  divider: { x: number; y1: number; y2: number };
  /** Ghost slot drawn when the stack is empty. */
  empty?: Box;
}

export interface CallTreeLayout {
  kind: "call-tree";
  density: Density;
  width: number;
  height: number;
  chips: CallChipGeom[];
  edges: CallEdgeGeom[];
  stack: CallStackColumn;
  /** Deepest level (0 for a lone root). */
  depth: number;
  font: number;
  resultFont: number;
  stackFont: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function shorten(text: string, max: number): string {
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join("")}…`;
}

function glyphs(text: string): number {
  return [...text].length;
}

function formatResult(raw: string | undefined): { text: string; tone: CallChipGeom["resultTone"] } | null {
  if (raw === undefined || raw === null) return null;
  const t = String(raw).trim();
  if (t === "") return null;
  if (t.startsWith("✓")) return { text: t, tone: "ok" };
  if (t.startsWith("✕") || t.startsWith("✗")) return { text: t, tone: "bad" };
  if (t.startsWith("=")) return { text: t, tone: "plain" };
  return { text: `= ${t}`, tone: "plain" };
}

export function layoutCallTree(scene: CallTreeScene, density: Density = "comfortable"): CallTreeLayout {
  const m = METRICS[density];

  // --- calls, de-duplicated, in call order ----------------------------------
  const calls: CallTreeScene["calls"] = [];
  const byId = new Map<string, CallTreeScene["calls"][number]>();
  for (const c of scene.calls) {
    if (!byId.has(c.id)) {
      byId.set(c.id, c);
      calls.push(c);
    }
  }
  const stackIds = scene.stack.filter((id, i, a) => a.indexOf(id) === i);
  const liveSet = new Set(stackIds.filter((id) => byId.has(id)));
  const topId = stackIds.length ? stackIds[stackIds.length - 1] : null;

  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    const list = marksBy.get(mk.id) ?? [];
    list.push(mk.role);
    marksBy.set(mk.id, list);
  }

  // --- chip sizes -----------------------------------------------------------
  interface Info {
    label: string;
    w: number;
    result: ReturnType<typeof formatResult>;
  }
  const info = new Map<string, Info>();
  for (const c of calls) {
    const label = shorten(c.label, m.maxChars);
    const result = c.status === "returned" ? formatResult(c.result) : null;
    const chars = Math.max(glyphs(label), result ? glyphs(shorten(result.text, m.maxChars)) : 0, c.status === "pruned" ? 6 : 0);
    info.set(c.id, {
      label,
      w: clamp(Math.ceil(chars * m.charW + 20), m.chipMinW, m.chipMaxW),
      result: result ? { ...result, text: shorten(result.text, m.maxChars) } : null,
    });
  }

  // --- tree shape -----------------------------------------------------------
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const c of calls) {
    if (c.parent !== null && c.parent !== c.id && byId.has(c.parent)) {
      const list = children.get(c.parent) ?? [];
      list.push(c.id);
      children.set(c.parent, list);
    } else {
      roots.push(c.id);
    }
  }

  const sw = new Map<string, number>();
  const placed = new Set<string>();
  const subtreeW = (id: string, seen: Set<string>): number => {
    const own = info.get(id)!.w;
    seen.add(id);
    const kids = (children.get(id) ?? []).filter((k) => !seen.has(k));
    let total = 0;
    for (const k of kids) total += subtreeW(k, seen);
    total += Math.max(0, kids.length - 1) * m.chipGap;
    const w = Math.max(own, total);
    sw.set(id, w);
    return w;
  };

  // Calls caught in a parent cycle never reach a root; promote them to roots.
  const reachable = new Set<string>();
  const mark = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    (children.get(id) ?? []).forEach(mark);
  };
  roots.forEach(mark);
  for (const c of calls) {
    if (!reachable.has(c.id)) {
      roots.push(c.id);
      mark(c.id);
    }
  }

  const rootGap = m.chipGap * 2;
  let treeW = 0;
  roots.forEach((r, i) => {
    treeW += subtreeW(r, new Set()) + (i > 0 ? rootGap : 0);
  });

  // --- positions (local to the tree, x from 0) ------------------------------
  const pos = new Map<string, { cx: number; depth: number }>();
  let maxDepth = 0;
  const place = (id: string, left: number, depth: number) => {
    if (placed.has(id)) return;
    placed.add(id);
    const span = sw.get(id) ?? info.get(id)!.w;
    pos.set(id, { cx: left + span / 2, depth });
    maxDepth = Math.max(maxDepth, depth);
    const kids = (children.get(id) ?? []).filter((k) => !placed.has(k));
    const total = kids.reduce((a, k) => a + (sw.get(k) ?? 0), 0) + Math.max(0, kids.length - 1) * m.chipGap;
    let x = left + (span - total) / 2;
    for (const k of kids) {
      place(k, x, depth + 1);
      x += (sw.get(k) ?? 0) + m.chipGap;
    }
  };
  let rx = 0;
  for (const r of roots) {
    place(r, rx, 0);
    rx += (sw.get(r) ?? 0) + rootGap;
  }

  // --- call-stack pile ------------------------------------------------------
  const stackFont = m.font - 0.5;
  const stackLabels = stackIds.map((id) => shorten(byId.get(id)?.label ?? id, m.maxChars));
  const longest = Math.max(0, ...stackLabels.map(glyphs));
  const colW = clamp(Math.ceil(Math.max(longest, 10) * m.charW * 0.96 + 24), m.colMinW, m.colMaxW);

  // --- sizes ----------------------------------------------------------------
  const levels = calls.length ? maxDepth + 1 : 1;
  const treeH = levels * m.chipH + (levels - 1) * m.levelGap;
  const rows = Math.max(1, stackIds.length);
  const colH = m.header + rows * m.boxH + (rows - 1) * m.boxGap + 8;
  const contentH = Math.max(treeH, colH);
  const height = m.padTop + contentH + m.padBottom;

  const minArea = m.baseW - 2 * m.padX - colW - m.colGap;
  const width = Math.max(m.baseW, 2 * m.padX + Math.max(treeW, 0) + m.colGap + colW);
  const area = Math.max(minArea, width - 2 * m.padX - colW - m.colGap);
  const treeLeft = m.padX + (area - treeW) / 2;
  const colX = width - m.padX - colW;

  // --- chips and edges ------------------------------------------------------
  const chips: CallChipGeom[] = calls.map((c) => {
    const p = pos.get(c.id)!;
    const i = info.get(c.id)!;
    const marks: MarkRole[] = [];
    if (c.status === "active") marks.push("focus");
    if (c.status === "pruned") marks.push("discarded");
    for (const r of marksBy.get(c.id) ?? []) if (!marks.includes(r)) marks.push(r);
    return {
      id: c.id,
      label: i.label,
      full: c.label,
      x: treeLeft + p.cx - i.w / 2,
      y: m.padTop + p.depth * (m.chipH + m.levelGap),
      w: i.w,
      h: m.chipH,
      cx: treeLeft + p.cx,
      depth: p.depth,
      status: c.status,
      result: i.result ? i.result.text : null,
      resultTone: i.result ? i.result.tone : "plain",
      marks,
      parent: c.parent !== null && placed.has(c.parent) && c.parent !== c.id ? c.parent : null,
      live: liveSet.has(c.id),
      top: c.id === topId,
    };
  });
  const chipBy = new Map(chips.map((c) => [c.id, c]));

  const edges: CallEdgeGeom[] = [];
  for (const c of chips) {
    const par = c.parent ? chipBy.get(c.parent) : undefined;
    if (!par || par.depth >= c.depth) continue;
    const tone: CallEdgeGeom["tone"] =
      c.live && par.live ? "live" : c.status === "pruned" ? "pruned" : c.status === "pending" ? "pending" : "done";
    edges.push({
      key: `${par.id}>${c.id}`,
      parent: par.id,
      child: c.id,
      from: { x: par.cx, y: par.y + par.h + 2 },
      to: { x: c.cx, y: c.y - 2 },
      tone,
    });
  }

  // --- stack column geometry ------------------------------------------------
  const floorY = m.padTop + contentH;
  const boxes: CallStackBoxGeom[] = stackIds.map((id, j) => ({
    id,
    label: stackLabels[j],
    x: colX,
    y: floorY - 6 - (j + 1) * m.boxH - j * m.boxGap,
    w: colW,
    h: m.boxH,
    top: j === stackIds.length - 1,
  }));
  const colTop = floorY - colH;
  const column: CallStackColumn = {
    box: { x: colX, y: colTop, w: colW, h: colH },
    header: { x: colX + colW / 2, y: colTop + 10, text: "call stack" },
    boxes,
    floor: { x1: colX - 4, x2: colX + colW + 4, y: floorY },
    divider: { x: colX - m.colGap / 2, y1: m.padTop, y2: floorY },
    empty: stackIds.length === 0 ? { x: colX, y: floorY - 6 - m.boxH, w: colW, h: m.boxH } : undefined,
  };

  return {
    kind: "call-tree",
    density,
    width,
    height,
    chips,
    edges,
    stack: column,
    depth: maxDepth,
    font: m.font,
    resultFont: m.resultFont,
    stackFont,
  };
}

/** `call:<id>`, `stack`. Leaves are pointed at from below, inner calls from above. */
export function resolveCallTreeTarget(
  scene: CallTreeScene,
  layout: CallTreeLayout,
  target: string,
): TargetInfo | null {
  void scene;
  const i = target.indexOf(":");
  const kind = (i < 0 ? target : target.slice(0, i)).trim();
  const id = i < 0 ? "" : target.slice(i + 1).trim();

  if (kind === "call" || kind === "node") {
    const c = layout.chips.find((g) => g.id === id);
    if (!c) return null;
    const box: Box = { x: c.x, y: c.y, w: c.w, h: c.h };
    const hasKids = layout.chips.some((g) => g.parent === c.id);
    return {
      x: c.cx,
      y: c.y + c.h / 2,
      box,
      side: hasKids ? "above" : "below",
      tipDx: hasKids ? -c.w * 0.3 : 0,
    };
  }

  if (kind === "stack") {
    const b = layout.stack.box;
    return { x: b.x + b.w / 2, y: b.y + b.h / 2, box: b, side: "above" };
  }

  return null;
}

function sample(parts: string[], max = 8): string {
  if (parts.length === 0) return "none";
  return parts.length <= max ? parts.join("; ") : `${parts.slice(0, max).join("; ")}; and ${parts.length - max} more`;
}

/** Plain-text description for screen readers. */
export function describeCallTree(scene: CallTreeScene): string {
  const calls = scene.calls;
  const by = (s: CallStatus) => calls.filter((c) => c.status === s);
  const label = (id: string) => calls.find((c) => c.id === id)?.label ?? id;
  const parts: string[] = [];
  if (calls.length === 0) parts.push("Call tree with no calls yet.");
  else {
    parts.push(
      `Call tree with ${calls.length} call${calls.length === 1 ? "" : "s"}: ${by("returned").length} returned, ${by("active").length} active, ${by("pending").length} pending, ${by("pruned").length} pruned.`,
    );
    const active = by("active");
    if (active.length) parts.push(`Active: ${sample(active.map((c) => c.label))}.`);
    const ret = by("returned");
    if (ret.length)
      parts.push(
        `Returned: ${sample(ret.map((c) => (c.result ? `${c.label} ${c.result.startsWith("=") || c.result.startsWith("✓") ? c.result : `= ${c.result}`}` : c.label)))}.`,
      );
    const pruned = by("pruned");
    if (pruned.length) parts.push(`Pruned: ${sample(pruned.map((c) => c.label))}.`);
  }
  parts.push(
    scene.stack.length
      ? `Call stack, bottom to top: ${sample(scene.stack.map(label), 10)}.`
      : "Call stack is empty.",
  );
  if (scene.marks?.length) parts.push(`Marked: ${sample(scene.marks.map((mk) => `${label(mk.id)} ${mk.role}`))}.`);
  if (scene.annotations?.length) parts.push(`Notes: ${sample(scene.annotations.map((a) => a.text))}.`);
  return parts.join(" ");
}
