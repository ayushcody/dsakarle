/**
 * Pure geometry for the graph scene. No React, no colours.
 *
 * Tracers give each node a logical `at: {col, row}` (col 0..5, row 0..3). The
 * layout spreads those over the canvas: columns share the usable width (the
 * pitch is capped, so a three-column graph stays compact), rows use a fixed
 * pitch tall enough for a badge under each node. Everything is computed in a
 * local frame (origin top-left of the paper) and shifted so the topmost thing
 * (a node, a pointer tag, a weight chip) sits `padTop` from the top.
 *
 * Only type imports from ../layout: that module imports this one.
 */
import type { GraphScene, MarkRole, PointerRole } from "@/lib/engine/types";
import type { ArrowRole } from "@/lib/stage/semantics";
import type { Point } from "@/lib/stage/sketch";
import type { Box, Density, TargetInfo } from "../layout";

interface GraphMetrics {
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  r: number;
  pitchXMax: number;
  pitchY: number;
  badgeH: number;
  badgeGap: number;
  chipH: number;
}

const METRICS: Record<Density, GraphMetrics> = {
  comfortable: {
    baseW: 680,
    padX: 24,
    padTop: 10,
    padBottom: 12,
    r: 22,
    pitchXMax: 150,
    pitchY: 92,
    badgeH: 17,
    badgeGap: 4,
    chipH: 16,
  },
  compact: {
    baseW: 560,
    padX: 18,
    padTop: 8,
    padBottom: 8,
    r: 17,
    pitchXMax: 110,
    pitchY: 66,
    badgeH: 15,
    badgeGap: 3,
    chipH: 14,
  },
};

/** Step between pointer tags that share a node and side (mirrors PointerTag's TAG_STACK). */
const TAG_STEP = 22;
/** Bend of an edge that has an opposite twin (fraction of its length). */
const TWIN_CURVE = 0.16;
/** How far the endpoints of a twin edge rotate away from the centre line (radians). */
const TWIN_SPREAD = 0.42;

export function seedOf(s: string | number): number {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 997;
}

const fin = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphBadgeGeom {
  text: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface GraphNodeGeom {
  id: string;
  label: string;
  cx: number;
  cy: number;
  r: number;
  marks: MarkRole[];
  badge?: GraphBadgeGeom;
  /** A `focus` pointer sits here and no `focus` mark already rings the node. */
  focusRing: boolean;
  seed: number;
}

export type EdgeTone = "plain" | "visited" | "discarded";

export interface GraphEdgeGeom {
  key: string;
  from: string;
  to: string;
  p0: Point;
  p1: Point;
  curve: number;
  role: ArrowRole;
  tone: EdgeTone;
  directed: boolean;
  seed: number;
  /** Midpoint of the drawn shaft (where the weight chip and `edge:` notes go). */
  mid: Point;
  weight?: string;
  chip?: { cx: number; cy: number; w: number; h: number };
}

export interface GraphTagGeom {
  key: string;
  name: string;
  role: PointerRole;
  nodeId: string;
  /** Centre x of the node. */
  x: number;
  /** Edge the tag attaches to (see PointerTag). */
  y: number;
  offset: number;
  side: "above" | "below";
  box: Box;
}

export interface GraphLayout {
  kind: "graph";
  density: Density;
  width: number;
  height: number;
  r: number;
  nodes: GraphNodeGeom[];
  edges: GraphEdgeGeom[];
  tags: GraphTagGeom[];
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface RawNode {
  id: string;
  label: string;
  col: number;
  row: number;
}

function edgeRole(role: GraphScene["edges"][number]["role"]): { role: ArrowRole; tone: EdgeTone } {
  switch (role) {
    case "focus":
    case "changed":
    case "found":
    case "error":
      return { role, tone: "plain" };
    case "visited":
      return { role: "neutral", tone: "visited" };
    case "discarded":
      return { role: "neutral", tone: "discarded" };
    default:
      return { role: "neutral", tone: "plain" };
  }
}

function chipWidth(text: string): number {
  return Math.max(18, text.length * 7 + 8);
}

function uniqueKey(seen: Map<string, number>, base: string): string {
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}~${n}`;
}

export function layoutGraph(scene: GraphScene, density: Density = "comfortable"): GraphLayout {
  const m = METRICS[density];
  const r = m.r;

  // Nodes: first occurrence of an id wins; missing positions fall back to a 6-wide grid.
  const raw: RawNode[] = [];
  const known = new Set<string>();
  (scene.nodes ?? []).forEach((n, i) => {
    if (!n || known.has(n.id)) return;
    known.add(n.id);
    const col = fin(n.at?.col) ? n.at.col : i % 6;
    const row = fin(n.at?.row) ? n.at.row : Math.floor(i / 6);
    raw.push({ id: n.id, label: String(n.label ?? n.id), col, row });
  });

  const width = m.baseW;
  if (raw.length === 0) {
    return { kind: "graph", density, width, height: m.padTop + 60 + m.padBottom, r, nodes: [], edges: [], tags: [] };
  }

  const minC = Math.min(...raw.map((n) => n.col));
  const maxC = Math.max(...raw.map((n) => n.col));
  const minR = Math.min(...raw.map((n) => n.row));
  const nCols = maxC - minC;
  const usable = width - 2 * (m.padX + r);
  const pitchX = nCols > 0 ? Math.min(m.pitchXMax, usable / nCols) : 0;
  const x0 = width / 2 - (nCols * pitchX) / 2;

  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    if (!known.has(mk.id)) continue;
    const list = marksBy.get(mk.id) ?? [];
    list.push(mk.role);
    marksBy.set(mk.id, list);
  }
  const badgeBy = new Map<string, string>();
  for (const b of scene.badges ?? []) {
    if (known.has(b.id) && b.text !== "") badgeBy.set(b.id, String(b.text));
  }

  const edgeKeys = new Set(
    (scene.edges ?? []).filter((e) => known.has(e.from) && known.has(e.to)).map((e) => `${e.from}->${e.to}`),
  );

  /** Builds all geometry with every y shifted by `oy`; returns it with its vertical extent. */
  const build = (oy: number) => {
    let minY = Infinity;
    let maxY = -Infinity;
    const grow = (y0: number, y1: number) => {
      minY = Math.min(minY, y0);
      maxY = Math.max(maxY, y1);
    };

    const nodes: GraphNodeGeom[] = raw.map((n) => {
      const cx = x0 + (n.col - minC) * pitchX;
      const cy = oy + (n.row - minR) * m.pitchY + r;
      grow(cy - r - 4, cy + r + 4);
      const text = badgeBy.get(n.id);
      let badge: GraphBadgeGeom | undefined;
      if (text !== undefined) {
        const w = Math.max(20, text.length * 6.8 + 12);
        badge = { text, cx, cy: cy + r + m.badgeGap + m.badgeH / 2, w, h: m.badgeH };
        grow(badge.cy - badge.h / 2, badge.cy + badge.h / 2);
      }
      return {
        id: n.id,
        label: n.label,
        cx,
        cy,
        r,
        marks: marksBy.get(n.id) ?? [],
        badge,
        focusRing: false,
        seed: seedOf(n.id) + 1,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // Edges.
    const seen = new Map<string, number>();
    const edges: GraphEdgeGeom[] = [];
    for (const e of scene.edges ?? []) {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b || a === b) continue;
      const directed = !!scene.directed;
      const twin = directed && edgeKeys.has(`${e.to}->${e.from}`);
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const gapFrom = 3;
      const gapTo = directed ? 6 : 3;

      let p0: Point;
      let p1: Point;
      let curve = 0;
      if (twin) {
        const c = Math.cos(TWIN_SPREAD);
        const s = Math.sin(TWIN_SPREAD);
        p0 = { x: a.cx + (r + gapFrom) * (ux * c + nx * s), y: a.cy + (r + gapFrom) * (uy * c + ny * s) };
        p1 = { x: b.cx + (r + gapTo) * (-ux * c + nx * s), y: b.cy + (r + gapTo) * (-uy * c + ny * s) };
        curve = TWIN_CURVE;
      } else {
        p0 = { x: a.cx + ux * (r + gapFrom), y: a.cy + uy * (r + gapFrom) };
        p1 = { x: b.cx - ux * (r + gapTo), y: b.cy - uy * (r + gapTo) };
      }

      // Midpoint of the shaft: chord midpoint pushed out by the bulge.
      const cdx = p1.x - p0.x;
      const cdy = p1.y - p0.y;
      const clen = Math.hypot(cdx, cdy) || 1;
      const bulge = curve * clen;
      const mid: Point = {
        x: (p0.x + p1.x) / 2 + (-cdy / clen) * bulge,
        y: (p0.y + p1.y) / 2 + (cdx / clen) * bulge,
      };

      const weight = fin(e.weight) ? String(e.weight) : undefined;
      const chip =
        weight !== undefined
          ? { cx: mid.x, cy: mid.y, w: chipWidth(weight), h: m.chipH }
          : undefined;
      if (chip) grow(chip.cy - chip.h / 2, chip.cy + chip.h / 2);
      grow(Math.min(p0.y, p1.y, mid.y), Math.max(p0.y, p1.y, mid.y));

      const { role, tone } = edgeRole(e.role);
      edges.push({
        key: uniqueKey(seen, `${e.from}->${e.to}`),
        from: e.from,
        to: e.to,
        p0,
        p1,
        curve,
        role,
        tone,
        directed,
        seed: seedOf(`${e.from}->${e.to}`),
        mid,
        weight,
        chip,
      });
    }

    // Pointer tags: ptrA hangs below its node, ptrB / focus sit above. Tags that share a node and side stack.
    const tags: GraphTagGeom[] = [];
    const ranks = new Map<string, number>();
    const tagKeys = new Map<string, number>();
    const focusPtr = new Set<string>();
    for (const p of scene.pointers ?? []) {
      if (!p.target) continue;
      const n = byId.get(p.target);
      if (!n) continue;
      const side: "above" | "below" = p.role === "ptrA" ? "below" : "above";
      const group = `${side}|${n.id}`;
      const rank = ranks.get(group) ?? 0;
      ranks.set(group, rank + 1);
      const offset = rank * TAG_STEP;
      const below = n.cy + r + (n.badge ? m.badgeGap + m.badgeH : 0) - 12;
      const y = side === "below" ? below : n.cy - r;
      const box: Box =
        side === "above"
          ? { x: n.cx - 22, y: y - 8 - offset - 28, w: 44, h: 28 }
          : { x: n.cx - 22, y: y + 20 + offset, w: 44, h: 28 };
      grow(box.y, box.y + box.h);
      if (p.role === "focus") focusPtr.add(n.id);
      tags.push({
        key: uniqueKey(tagKeys, p.name),
        name: p.name,
        role: p.role,
        nodeId: n.id,
        x: n.cx,
        y,
        offset,
        side,
        box,
      });
    }
    for (const n of nodes) n.focusRing = focusPtr.has(n.id) && !n.marks.includes("focus");

    return { nodes, edges, tags, minY, maxY };
  };

  const first = build(0);
  const shift = m.padTop - first.minY;
  const { nodes, edges, tags, maxY } = build(shift);
  const height = Math.max(m.padTop + 2 * r, maxY + m.padBottom);

  return { kind: "graph", density, width, height, r, nodes, edges, tags };
}

// ---------------------------------------------------------------------------
// Note targets: node:<id>, ptr:<name>, edge:<from>-<to>
// ---------------------------------------------------------------------------

const centreOf = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function resolveGraphTarget(
  scene: GraphScene,
  layout: GraphLayout,
  target: string,
): TargetInfo | null {
  void scene;
  const i = target.indexOf(":");
  const kind = (i < 0 ? target : target.slice(0, i)).trim();
  const id = i < 0 ? "" : target.slice(i + 1).trim();

  if (kind === "ptr") {
    const t = layout.tags.find((p) => p.name === id);
    return t ? { ...centreOf(t.box), box: t.box, side: t.side } : null;
  }

  if (kind === "node" || kind === "cell") {
    const n = layout.nodes.find((g) => g.id === id);
    if (!n) return null;
    const bottom = n.badge ? n.badge.cy + n.badge.h / 2 : n.cy + n.r;
    const box: Box = { x: n.cx - n.r, y: n.cy - n.r, w: n.r * 2, h: bottom - (n.cy - n.r) };
    const tagged = layout.tags.some((t) => t.nodeId === n.id);
    return { ...centreOf(box), box, tipDx: tagged ? n.r * 0.6 : 0 };
  }

  if (kind === "edge") {
    const e = layout.edges.find(
      (g) => id === `${g.from}-${g.to}` || (!g.directed && id === `${g.to}-${g.from}`),
    );
    if (!e) return null;
    const w = e.chip ? e.chip.w : 28;
    const h = e.chip ? e.chip.h : 16;
    const box: Box = { x: e.mid.x - w / 2, y: e.mid.y - h / 2, w, h };
    return { ...centreOf(box), box };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Screen-reader summary
// ---------------------------------------------------------------------------

export function describeGraph(scene: GraphScene): string {
  const nodes = scene.nodes ?? [];
  const label = new Map(nodes.map((n) => [n.id, String(n.label ?? n.id)]));
  const name = (id: string) => label.get(id) ?? id;
  const marks = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) marks.set(mk.id, [...(marks.get(mk.id) ?? []), mk.role]);
  const badges = new Map((scene.badges ?? []).map((b) => [b.id, b.text]));

  const nodeBits = nodes.map((n) => {
    const extra = [
      ...(badges.has(n.id) ? [`badge ${badges.get(n.id)}`] : []),
      ...(marks.get(n.id) ?? []),
    ];
    return extra.length ? `${name(n.id)} (${extra.join(", ")})` : name(n.id);
  });

  const arrow = scene.directed ? " to " : " and ";
  const edges = (scene.edges ?? []).map((e) => {
    const bits = [`${name(e.from)}${arrow}${name(e.to)}`];
    if (fin(e.weight)) bits.push(`weight ${e.weight}`);
    if (e.role) bits.push(e.role);
    return bits.join(" ");
  });

  const ptrs = (scene.pointers ?? []).map((p) =>
    p.target ? `${p.name} at ${name(p.target)}` : `${p.name} at none`,
  );

  const parts = [
    `${scene.directed ? "Directed" : "Undirected"} graph with ${nodes.length} node${nodes.length === 1 ? "" : "s"} and ${edges.length} edge${edges.length === 1 ? "" : "s"}.`,
    nodes.length ? `Nodes: ${nodeBits.join(", ")}.` : "",
    edges.length ? `Edges: ${edges.join("; ")}.` : "",
    ptrs.length ? `Pointers: ${ptrs.join(", ")}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
