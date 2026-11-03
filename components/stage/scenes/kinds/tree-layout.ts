/**
 * Pure geometry for the tree scene (binary trees, BSTs, heaps drawn as trees,
 * and n-ary tries). No React, no colours. Local frame: origin at the top-left
 * of the paper, x grows right, y grows down.
 *
 * Layout rules
 * - Complete binary trees (heaps, perfect BSTs) use fixed slots: depth d has
 *   2^d slots across the width of the bottom row, so they always look balanced
 *   and a heap never reshuffles while it fills a level.
 * - Every other tree uses a tidy (Reingold-Tilford style) layout from subtree
 *   contours: sibling subtrees are pushed apart until no two nodes on the same
 *   depth are closer than one pitch, and a parent sits centred over its
 *   children. In a binary tree a node with a single child hangs it half a pitch
 *   to the side it belongs on, so a missing left child still reserves the left.
 * - Tries (any node with more than two children, edge labels or a terminal
 *   flag) use the same contour layout with straight-down single children.
 * - Floating (unattached) nodes form a column at the right of the paper, with a
 *   short dashed leader.
 * Every x and y comes from the data; nothing is placed by hand.
 */
import type { MarkRole, PointerRole, TreeNode, TreeScene } from "@/lib/engine/types";
import type { Point } from "@/lib/stage/sketch";
import type { Box, Density, TargetInfo } from "../layout";

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

interface TreeMetrics {
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  /** Node radius. */
  r: number;
  /** Minimum centre-to-centre distance of two nodes on one depth. */
  pitch: number;
  /** Vertical distance between depths. */
  levelGap: number;
}

const METRICS: Record<Density, TreeMetrics> = {
  comfortable: { baseW: 680, padX: 44, padTop: 8, padBottom: 10, r: 20, pitch: 56, levelGap: 76 },
  compact: { baseW: 560, padX: 36, padTop: 6, padBottom: 8, r: 16, pitch: 44, levelGap: 64 },
};

const TRIE_METRICS: Record<Density, Pick<TreeMetrics, "r" | "pitch" | "levelGap">> = {
  comfortable: { r: 18, pitch: 64, levelGap: 84 },
  compact: { r: 14, pitch: 50, levelGap: 70 },
};

/** Mirrors layout.ts TAG_STEP / PointerTag geometry. */
const TAG_STEP = 22;
const TAG_ABOVE = 36;
const FLOAT_LEADER = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TreeEdgeRole = "neutral" | "focus" | "visited" | "changed" | "found" | "error";

export interface TreeNodeGeom {
  id: string;
  value: number | string;
  cx: number;
  cy: number;
  r: number;
  depth: number;
  parent: string | null;
  marks: MarkRole[];
  terminal: boolean;
  floating: boolean;
}

export interface TreeEdgeGeom {
  key: string;
  parent: string;
  child: string;
  from: Point;
  to: Point;
  role: TreeEdgeRole;
  label: string | null;
  labelAt: Point;
  seed: number;
}

export interface TreeTagGeom {
  key: string;
  name: string;
  role: PointerRole;
  nodeId: string;
  /** Attach point handed to PointerTag. */
  x: number;
  y: number;
  offset: number;
  side: "above" | "below";
  box: Box;
}

export interface TreeFocusRing {
  key: string;
  cx: number;
  cy: number;
  r: number;
}

export interface TreeLeader {
  key: string;
  from: Point;
  to: Point;
  seed: number;
}

export interface TreeLayout {
  kind: "tree";
  density: Density;
  width: number;
  height: number;
  /** True for n-ary tries (edge labels, terminal rings, wider spacing). */
  trie: boolean;
  /** True when the main tree used the fixed-slot (complete tree) layout. */
  complete: boolean;
  r: number;
  nodes: TreeNodeGeom[];
  edges: TreeEdgeGeom[];
  tags: TreeTagGeom[];
  rings: TreeFocusRing[];
  leaders: TreeLeader[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Small deterministic string hash, used as a stable sketch seed. */
export function seedOf(s: string | number): number {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 997;
}

interface Kid {
  id: string;
  slot: number;
  label: string | null;
}

interface Sub {
  /** x of every node, relative to this subtree's root (0), in pitch units. */
  xs: Map<string, number>;
  /** Leftmost / rightmost x on each depth below (and including) the root. */
  lo: number[];
  hi: number[];
}

/** Does this scene draw a trie (n-ary, labelled edges, terminal rings)? */
export function isTrieScene(scene: TreeScene): boolean {
  return scene.nodes.some(
    (n) =>
      n.children.length > 2 ||
      n.terminal !== undefined ||
      (n.edgeLabels ?? []).some((l) => l !== null && l !== undefined && l !== ""),
  );
}

interface Forest {
  byId: Map<string, TreeNode>;
  kids: Map<string, Kid[]>;
  depth: Map<string, number>;
  parent: Map<string, string | null>;
  /** Roots in the order they were walked: main root first, then floating / orphan roots. */
  roots: string[];
  mainSet: Set<string>;
}

function buildForest(scene: TreeScene): Forest {
  const byId = new Map<string, TreeNode>();
  for (const n of scene.nodes) if (!byId.has(n.id)) byId.set(n.id, n);

  const kids = new Map<string, Kid[]>();
  const depth = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const seen = new Set<string>();

  const walk = (rootId: string) => {
    depth.set(rootId, 0);
    parent.set(rootId, null);
    seen.add(rootId);
    const stack = [rootId];
    const order: string[] = [];
    while (stack.length) {
      const id = stack.pop()!;
      order.push(id);
      const node = byId.get(id)!;
      const list: Kid[] = [];
      node.children.forEach((c, slot) => {
        if (c === null || c === undefined || !byId.has(c) || seen.has(c)) return;
        seen.add(c);
        depth.set(c, depth.get(id)! + 1);
        parent.set(c, id);
        const label = node.edgeLabels?.[slot];
        list.push({ id: c, slot, label: label === undefined || label === null || label === "" ? null : String(label) });
      });
      kids.set(id, list);
      for (let i = list.length - 1; i >= 0; i--) stack.push(list[i].id);
    }
  };

  const roots: string[] = [];
  const mainSet = new Set<string>();
  if (scene.root !== null && byId.has(scene.root)) {
    walk(scene.root);
    roots.push(scene.root);
    for (const id of seen) mainSet.add(id);
  }
  // Floating roots, then any node nothing points at (orphans) so nothing is lost.
  const childOf = new Set<string>();
  for (const n of scene.nodes) for (const c of n.children) if (c) childOf.add(c);
  for (const id of scene.floating ?? []) {
    if (byId.has(id) && !seen.has(id)) {
      walk(id);
      roots.push(id);
    }
  }
  for (const n of scene.nodes) {
    if (byId.has(n.id) && !seen.has(n.id) && !childOf.has(n.id)) {
      walk(n.id);
      roots.push(n.id);
    }
  }
  // Remaining nodes sit in a cycle of their own; draw them as roots too.
  for (const n of scene.nodes) {
    if (byId.has(n.id) && !seen.has(n.id)) {
      walk(n.id);
      roots.push(n.id);
    }
  }
  return { byId, kids, depth, parent, roots, mainSet };
}

/** Tidy layout of the subtree under `rootId`; x in pitch units, root at 0. */
function placeSubtree(rootId: string, kids: Map<string, Kid[]>, binary: boolean): Sub {
  const go = (id: string): Sub => {
    const list = kids.get(id) ?? [];
    if (list.length === 0) return { xs: new Map([[id, 0]]), lo: [0], hi: [0] };

    if (binary && list.length === 1) {
      const s = go(list[0].id);
      const off = list[0].slot === 0 ? -0.5 : 0.5;
      return shiftJoin(id, [{ sub: s, at: off }], 0);
    }

    // Place children left to right, each as close as the contours allow.
    const subs = list.map((k) => go(k.id));
    const placed: Array<{ sub: Sub; at: number }> = [];
    const accHi: number[] = [];
    subs.forEach((s, i) => {
      let at = 0;
      if (i > 0) {
        at = -Infinity;
        for (let d = 0; d < s.lo.length && d < accHi.length; d++) {
          at = Math.max(at, accHi[d] - s.lo[d] + 1);
        }
        if (!Number.isFinite(at)) at = placed[i - 1].at + 1;
      }
      placed.push({ sub: s, at });
      s.hi.forEach((h, d) => {
        accHi[d] = Math.max(accHi[d] ?? -Infinity, h + at);
      });
    });
    const centre = (placed[0].at + placed[placed.length - 1].at) / 2;
    return shiftJoin(id, placed, centre);
  };

  /** Builds the parent's Sub: children at `at - centre`, parent at 0. */
  const shiftJoin = (id: string, parts: Array<{ sub: Sub; at: number }>, centre: number): Sub => {
    const xs = new Map<string, number>([[id, 0]]);
    const lo: number[] = [0];
    const hi: number[] = [0];
    for (const { sub, at } of parts) {
      const dx = at - centre;
      for (const [k, x] of sub.xs) xs.set(k, x + dx);
      sub.lo.forEach((l, d) => {
        lo[d + 1] = Math.min(lo[d + 1] ?? Infinity, l + dx);
      });
      sub.hi.forEach((h, d) => {
        hi[d + 1] = Math.max(hi[d + 1] ?? -Infinity, h + dx);
      });
    }
    return { xs, lo, hi };
  };

  return go(rootId);
}

/** Heap-style slot positions if the tree is complete (nodes fill indices 0..n-1), else null. */
function completeSlots(
  rootId: string,
  kids: Map<string, Kid[]>,
): { xs: Map<string, number>; levels: number } | null {
  const index = new Map<string, number>();
  const stack: Array<[string, number]> = [[rootId, 0]];
  let max = 0;
  while (stack.length) {
    const [id, i] = stack.pop()!;
    index.set(id, i);
    max = Math.max(max, i);
    for (const k of kids.get(id) ?? []) {
      if (k.slot > 1) return null;
      stack.push([k.id, 2 * i + 1 + k.slot]);
    }
  }
  const n = index.size;
  if (max !== n - 1) return null;
  const levels = Math.floor(Math.log2(n)) + 1;
  const leaves = 2 ** (levels - 1);
  const xs = new Map<string, number>();
  for (const [id, i] of index) {
    const d = Math.floor(Math.log2(i + 1));
    const p = i - (2 ** d - 1);
    xs.set(id, ((p + 0.5) * leaves) / 2 ** d);
  }
  return { xs, levels };
}

const tagBox = (side: "above" | "below", x: number, y: number, offset: number): Box =>
  side === "above"
    ? { x: x - 22, y: y - 8 - offset - 28, w: 44, h: 28 }
    : { x: x - 22, y: y + 20 + offset, w: 44, h: 28 };

const sideOf = (role: PointerRole): "above" | "below" => (role === "ptrA" ? "below" : "above");

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function layoutTreeGeometry(scene: TreeScene, density: Density = "comfortable"): TreeLayout {
  const base = METRICS[density];
  const trie = isTrieScene(scene);
  const m: TreeMetrics = trie ? { ...base, ...TRIE_METRICS[density] } : base;
  const forest = buildForest(scene);
  // Very deep trees (skewed BSTs) get a tighter row spacing so they stay on screen.
  let deepest = 0;
  for (const d of forest.depth.values()) deepest = Math.max(deepest, d);
  const { r, pitch } = m;
  const levelGap = deepest >= 6 ? Math.round(m.levelGap * 0.8) : m.levelGap;

  const binary = !trie;

  // --- relative x per root (pitch units) ------------------------------------
  const subs = new Map<string, Sub>();
  let complete = false;
  forest.roots.forEach((rootId, i) => {
    const isMain = i === 0 && forest.mainSet.has(rootId);
    if (isMain && binary) {
      const slots = completeSlots(rootId, forest.kids);
      if (slots) {
        complete = true;
        subs.set(rootId, { xs: slots.xs, lo: [], hi: [] });
        return;
      }
    }
    subs.set(rootId, placeSubtree(rootId, forest.kids, binary));
  });

  const hasMain = forest.roots.length > 0 && forest.mainSet.has(forest.roots[0]);
  const mainRoot = hasMain ? forest.roots[0] : null;
  const floatRoots = forest.roots.filter((id) => id !== mainRoot);

  const spanOf = (sub: Sub) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const x of sub.xs.values()) {
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    return { lo, hi };
  };

  const mainSpan = mainRoot ? spanOf(subs.get(mainRoot)!) : { lo: 0, hi: 0 };
  const mainW = mainRoot ? (mainSpan.hi - mainSpan.lo) * pitch : 0;
  const width0 = Math.max(m.baseW, mainW + 2 * m.padX);
  const x0 = (width0 - mainW) / 2;

  // --- tag stacking ranks (needed to size the headroom) ----------------------
  const nodeIds = new Set(forest.byId.keys());
  const rankOf = new Map<string, number>(); // `${side}|${node}` -> next rank
  const rawTags: Array<{
    key: string;
    name: string;
    role: PointerRole;
    nodeId: string;
    side: "above" | "below";
    rank: number;
  }> = [];
  const seenKey = new Map<string, number>();
  for (const p of scene.pointers ?? []) {
    if (p.target === null || !nodeIds.has(p.target)) continue;
    const side = sideOf(p.role);
    const g = `${side}|${p.target}`;
    const rank = rankOf.get(g) ?? 0;
    rankOf.set(g, rank + 1);
    const n = seenKey.get(p.name) ?? 0;
    seenKey.set(p.name, n + 1);
    rawTags.push({ key: n === 0 ? p.name : `${p.name}~${n}`, name: p.name, role: p.role, nodeId: p.target, side, rank });
  }
  const topRow = new Set<string>();
  if (mainRoot) topRow.add(mainRoot);
  if (floatRoots[0]) topRow.add(floatRoots[0]);
  let topRank = 0;
  for (const t of rawTags) if (t.side === "above" && topRow.has(t.nodeId)) topRank = Math.max(topRank, t.rank);
  const headroom = Math.ceil(0.85 * r) + TAG_ABOVE + 4 + TAG_STEP * topRank;
  const row0 = m.padTop + Math.max(r + 6, headroom);

  // --- main tree -------------------------------------------------------------
  const nodes: TreeNodeGeom[] = [];
  const geom = new Map<string, TreeNodeGeom>();
  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    const l = marksBy.get(mk.id) ?? [];
    if (!l.includes(mk.role)) l.push(mk.role);
    marksBy.set(mk.id, l);
  }
  const addNode = (id: string, cx: number, cy: number, floating: boolean) => {
    const src = forest.byId.get(id)!;
    const g: TreeNodeGeom = {
      id,
      value: src.value,
      cx,
      cy,
      r,
      depth: forest.depth.get(id) ?? 0,
      parent: forest.parent.get(id) ?? null,
      marks: marksBy.get(id) ?? [],
      terminal: src.terminal === true,
      floating,
    };
    geom.set(id, g);
    nodes.push(g);
  };

  if (mainRoot) {
    const sub = subs.get(mainRoot)!;
    for (const [id, x] of sub.xs) {
      addNode(id, x0 + (x - mainSpan.lo) * pitch, row0 + (forest.depth.get(id) ?? 0) * levelGap, false);
    }
  }
  const mainRight = mainRoot ? x0 + mainW + r : 0;

  // --- floating column -------------------------------------------------------
  let width = width0;
  const leaders: TreeLeader[] = [];
  if (floatRoots.length > 0) {
    const spans = floatRoots.map((id) => spanOf(subs.get(id)!));
    const widths = spans.map((s) => (s.hi - s.lo) * pitch + 2 * r);
    const colW = Math.max(...widths);
    const gap = pitch * 0.6 + FLOAT_LEADER;
    const colLeft = Math.max(width0 - m.padX - colW, (mainRoot ? mainRight + gap : m.padX + FLOAT_LEADER));
    width = Math.max(width0, colLeft + colW + m.padX);
    let y = row0;
    floatRoots.forEach((id, i) => {
      const sub = subs.get(id)!;
      const span = spans[i];
      const left = colLeft + (colW - widths[i]) / 2 + r;
      let maxDepth = 0;
      for (const [nid, x] of sub.xs) {
        const d = forest.depth.get(nid) ?? 0;
        maxDepth = Math.max(maxDepth, d);
        addNode(nid, left + (x - span.lo) * pitch, y + d * levelGap, true);
      }
      const root = geom.get(id)!;
      leaders.push({
        key: `leader-${id}`,
        from: { x: root.cx - r - 6, y: root.cy },
        to: { x: root.cx - r - 6 - FLOAT_LEADER, y: root.cy },
        seed: seedOf(id) + 7,
      });
      y += maxDepth * levelGap + 2 * r + 16;
    });
  }

  // --- edges -----------------------------------------------------------------
  const edgeMarks = new Map<string, TreeEdgeRole>();
  for (const em of scene.edgeMarks ?? []) {
    edgeMarks.set(`${em.from}>${em.to}`, em.role);
  }
  const edges: TreeEdgeGeom[] = [];
  for (const [parentId, list] of forest.kids) {
    const p = geom.get(parentId);
    if (!p) continue;
    for (const k of list) {
      const c = geom.get(k.id);
      if (!c) continue;
      const dx = c.cx - p.cx;
      const dy = c.cy - p.cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const gapP = (p.terminal ? 8 : 5) + p.r;
      const gapC = (c.terminal ? 8 : 5) + c.r;
      const from = { x: p.cx + ux * gapP, y: p.cy + uy * gapP };
      const to = { x: c.cx - ux * gapC, y: c.cy - uy * gapC };
      const role = edgeMarks.get(`${parentId}>${k.id}`) ?? edgeMarks.get(`${k.id}>${parentId}`) ?? "neutral";
      const sign = dx < -0.5 ? -1 : 1;
      edges.push({
        key: `edge-${parentId}>${k.id}`,
        parent: parentId,
        child: k.id,
        from,
        to,
        role,
        label: k.label,
        labelAt: { x: (from.x + to.x) / 2 + sign * 10, y: (from.y + to.y) / 2 },
        seed: seedOf(`${parentId}>${k.id}`) + 3,
      });
    }
  }

  // --- pointer tags and focus rings -------------------------------------------
  const tags: TreeTagGeom[] = [];
  const rings: TreeFocusRing[] = [];
  for (const t of rawTags) {
    const n = geom.get(t.nodeId);
    if (!n) continue;
    const offset = t.rank * TAG_STEP;
    let x: number;
    let y: number;
    if (t.side === "below") {
      x = n.cx - 0.6 * r;
      y = n.cy + 0.8 * r;
    } else {
      // Sit on the side away from the parent edge that arrives from above.
      const par = n.parent ? geom.get(n.parent) : undefined;
      const s = par ? (n.cx < par.cx - 0.5 ? -1 : 1) : 0;
      x = n.cx + s * 0.55 * r;
      y = n.cy - 0.84 * r;
    }
    tags.push({ key: t.key, name: t.name, role: t.role, nodeId: t.nodeId, x, y, offset, side: t.side, box: tagBox(t.side, x, y, offset) });
    if (t.role === "focus") rings.push({ key: `ring-${t.key}`, cx: n.cx, cy: n.cy, r: r + 3 });
  }

  // --- height ------------------------------------------------------------------
  let maxCy = row0;
  for (const n of nodes) maxCy = Math.max(maxCy, n.cy);
  let below = r + 10;
  for (const t of tags) {
    const n = geom.get(t.nodeId)!;
    if (t.side === "below" && Math.abs(n.cy - maxCy) < 1) below = Math.max(below, t.box.y + t.box.h - n.cy + 4);
  }
  const height = maxCy + below + m.padBottom;

  return { kind: "tree", density, width, height, trie, complete, r, nodes, edges, tags, rings, leaders };
}

// ---------------------------------------------------------------------------
// Note targets
// ---------------------------------------------------------------------------

/**
 * `node:<id>` (also `cell:<id>`) the node; `ptr:<name>` a pointer tag. Anything
 * else, or an id the scene does not contain, resolves to null.
 */
export function resolveTreeTargetIn(layout: TreeLayout, target: string): TargetInfo | null {
  const i = target.indexOf(":");
  const kind = i < 0 ? target.trim() : target.slice(0, i).trim();
  const id = i < 0 ? "" : target.slice(i + 1).trim();

  if (kind === "ptr") {
    const t = layout.tags.find((p) => p.name === id);
    if (!t) return null;
    return { x: t.box.x + t.box.w / 2, y: t.box.y + t.box.h / 2, box: t.box, side: t.side };
  }
  if (kind === "node" || kind === "cell") {
    const n = layout.nodes.find((g) => g.id === id);
    if (!n) return null;
    const box: Box = { x: n.cx - n.r, y: n.cy - n.r, w: n.r * 2, h: n.r * 2 };
    const hasTag = layout.tags.some((t) => t.nodeId === n.id);
    return {
      x: n.cx,
      y: n.cy,
      box,
      // Notes leave from the nearer band so the leader crosses as little tree as possible.
      side: n.cy < layout.height / 2 ? "above" : "below",
      tipDx: hasTag ? n.r * 0.3 : 0,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Screen-reader summary
// ---------------------------------------------------------------------------

export function describeTreeScene(scene: TreeScene): string {
  if (scene.nodes.length === 0) {
    const empty = isTrieScene(scene) ? "Trie" : "Tree";
    return `${empty}: empty.`;
  }
  const trie = isTrieScene(scene);
  const byId = new Map<string, TreeNode>();
  for (const n of scene.nodes) if (!byId.has(n.id)) byId.set(n.id, n);

  const counts = new Map<string, number>();
  for (const n of byId.values()) counts.set(String(n.value), (counts.get(String(n.value)) ?? 0) + 1);
  const name = (id: string | null | undefined): string => {
    if (id === null || id === undefined) return "none";
    const n = byId.get(id);
    if (!n) return id;
    const v = String(n.value);
    if (v === "") return id;
    return (counts.get(v) ?? 0) > 1 ? `${v} (${id})` : v;
  };
  const list = (items: string[]) => (items.length ? items.join("; ") : "none");

  const parts: string[] = [];
  parts.push(
    `${trie ? "Trie" : "Binary tree"} with ${byId.size} node${byId.size === 1 ? "" : "s"}.`,
  );
  parts.push(scene.root === null ? "Root: none." : `Root: ${name(scene.root)}.`);

  const rows: string[] = [];
  for (const n of byId.values()) {
    const kids = n.children
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c !== null && c !== undefined);
    const tail = n.terminal ? " ends a word" : "";
    if (trie) {
      if (kids.length === 0 && !tail) continue;
      const via = kids.map(({ c, i }) => {
        const l = n.edgeLabels?.[i];
        return l && l !== name(c) ? `${name(c)} via ${l}` : name(c);
      });
      rows.push(`${name(n.id)}${tail}${kids.length ? `: children ${via.join(", ")}` : ""}`);
    } else {
      if (kids.length === 0) continue;
      const left = n.children[0] ?? null;
      const right = n.children[1] ?? null;
      rows.push(`${name(n.id)}: left ${name(left)}, right ${name(right)}`);
    }
  }
  if (rows.length) parts.push(`Structure: ${list(rows)}.`);
  if (scene.floating?.length) parts.push(`Not yet attached: ${scene.floating.map(name).join(", ")}.`);
  if (scene.pointers?.length)
    parts.push(`Pointers: ${list(scene.pointers.map((p) => `${p.name} at ${p.target === null ? "null" : name(p.target)}`))}.`);
  if (scene.marks?.length)
    parts.push(`Marked: ${list(scene.marks.map((mk) => `${name(mk.id)} ${mk.role}`))}.`);
  if (scene.edgeMarks?.length)
    parts.push(
      `Highlighted edges: ${list(scene.edgeMarks.map((e) => `${name(e.from)} to ${name(e.to)} ${e.role}`))}.`,
    );
  if (scene.annotations?.length) parts.push(`Notes: ${list(scene.annotations.map((a) => a.text))}.`);
  return parts.join(" ");
}
