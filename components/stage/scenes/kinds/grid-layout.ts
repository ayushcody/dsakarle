/**
 * Pure geometry for the grid scene (DP tables, BFS on a grid, matrices). No
 * React, no colours.
 *
 * Cells are squares (~52px comfortable, ~38px compact; they shrink toward a
 * floor for wide grids and the viewBox grows past the base width if even the
 * floor does not fit). Row labels sit in the left margin, column labels above
 * the first row, the scene label runs vertically in the far left margin.
 * Pointer tags are small flags straddling a cell's edge: ptrA on the bottom
 * edge, ptrB / focus on the top edge. Dependency arrows run from near the
 * source cell's centre to near the target cell's centre.
 *
 * Only type imports from ../layout: that module imports this one.
 */
import type { GridScene, MarkRole, PointerRole } from "@/lib/engine/types";
import type { Point } from "@/lib/stage/sketch";
import type { Box, Density, TargetInfo } from "../layout";

interface GridMetrics {
  baseW: number;
  padX: number;
  padTop: number;
  padBottom: number;
  cellMax: number;
  cellMin: number;
  gap: number;
  colLabelBand: number;
}

const METRICS: Record<Density, GridMetrics> = {
  comfortable: { baseW: 680, padX: 20, padTop: 8, padBottom: 10, cellMax: 52, cellMin: 34, gap: 4, colLabelBand: 20 },
  compact: { baseW: 560, padX: 14, padTop: 6, padBottom: 8, cellMax: 38, cellMin: 24, gap: 3, colLabelBand: 17 },
};

/** Half the height of a pointer flag: how far it pokes past the grid edge. */
const FLAG_H = 16;
const FLAG_OVERHANG = FLAG_H / 2;
const FLAG_GAP = 4;
const ARROW_CURVE = 0.14;

type GridPointer = NonNullable<GridScene["pointers"]>[number];

const fin = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridCellGeom {
  r: number;
  c: number;
  x: number;
  y: number;
  w: number;
  h: number;
  value: number | string | null;
  marks: MarkRole[];
  /** `#` cells are walls. */
  wall: boolean;
  seed: number;
}

export interface GridLabelGeom {
  key: string;
  text: string;
  x: number;
  y: number;
}

export interface GridFlagGeom {
  key: string;
  name: string;
  role: PointerRole;
  r: number;
  c: number;
  side: "above" | "below";
  /** Centre x and the cell edge y the flag straddles. */
  x: number;
  y: number;
  w: number;
  h: number;
  box: Box;
}

export interface GridRingGeom {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridArrowGeom {
  key: string;
  p0: Point;
  p1: Point;
  curve: number;
  seed: number;
}

export interface GridLayout {
  kind: "grid";
  density: Density;
  width: number;
  height: number;
  rows: number;
  cols: number;
  cell: number;
  pitch: number;
  /** Top-left of the cell block. */
  x0: number;
  y0: number;
  gridW: number;
  gridH: number;
  cells: GridCellGeom[];
  rowLabels: GridLabelGeom[];
  colLabels: GridLabelGeom[];
  /** Width reserved for row labels (0 when there are none). */
  rowLabelW: number;
  label?: { text: string; x: number; y: number };
  flags: GridFlagGeom[];
  rings: GridRingGeom[];
  arrows: GridArrowGeom[];
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function seedOf(n: number): number {
  return (Math.imul(n + 1, 2654435761) >>> 0) % 997;
}

export function layoutGrid(scene: GridScene, density: Density = "comfortable"): GridLayout {
  const m = METRICS[density];
  const data = scene.rows ?? [];
  const R = data.length;
  const C = data.reduce((best, row) => Math.max(best, row?.length ?? 0), 0);

  if (R === 0 || C === 0) {
    return {
      kind: "grid",
      density,
      width: m.baseW,
      height: m.padTop + 56 + m.padBottom,
      rows: R,
      cols: C,
      cell: m.cellMax,
      pitch: m.cellMax + m.gap,
      x0: m.baseW / 2,
      y0: m.padTop,
      gridW: 0,
      gridH: 0,
      cells: [],
      rowLabels: [],
      colLabels: [],
      rowLabelW: 0,
      flags: [],
      rings: [],
      arrows: [],
    };
  }

  const rowLabelTexts = scene.rowLabels ?? [];
  const colLabelTexts = scene.colLabels ?? [];
  const hasRowLabels = rowLabelTexts.some((t) => t !== "" && t != null);
  const hasColLabels = colLabelTexts.some((t) => t !== "" && t != null);
  const rowLabelW = hasRowLabels
    ? Math.max(14, Math.max(...rowLabelTexts.map((t) => String(t ?? "").length)) * 7)
    : 0;
  const labelText = scene.label ?? "";
  const left = m.padX + (hasRowLabels ? rowLabelW + 10 : 0) + (labelText ? 22 : 0);
  const right = m.padX;

  const fit = Math.floor((m.baseW - left - right - (C - 1) * m.gap) / C);
  const cell = clamp(fit, m.cellMin, m.cellMax);
  const pitch = cell + m.gap;
  const gridW = C * cell + (C - 1) * m.gap;
  const gridH = R * cell + (R - 1) * m.gap;
  const width = Math.max(m.baseW, left + right + gridW);
  const x0 = Math.max(left, (width - gridW) / 2);
  const y0 = m.padTop + FLAG_OVERHANG + (hasColLabels ? m.colLabelBand : 0);

  // Marks per cell.
  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    if (!fin(mk.r) || !fin(mk.c)) continue;
    const key = `${Math.round(mk.r)},${Math.round(mk.c)}`;
    const list = marksBy.get(key) ?? [];
    list.push(mk.role);
    marksBy.set(key, list);
  }

  const cells: GridCellGeom[] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const raw = data[r]?.[c];
      const value = raw === undefined ? null : raw;
      cells.push({
        r,
        c,
        x: x0 + c * pitch,
        y: y0 + r * pitch,
        w: cell,
        h: cell,
        value,
        marks: marksBy.get(`${r},${c}`) ?? [],
        wall: value === "#",
        seed: seedOf(r * C + c),
      });
    }
  }

  const rowLabels: GridLabelGeom[] = [];
  for (let r = 0; r < R; r++) {
    const t = rowLabelTexts[r];
    if (t === undefined || t === null || t === "") continue;
    rowLabels.push({ key: `row-${r}`, text: String(t), x: x0 - 10, y: y0 + r * pitch + cell / 2 });
  }
  const colLabels: GridLabelGeom[] = [];
  for (let c = 0; c < C; c++) {
    const t = colLabelTexts[c];
    if (t === undefined || t === null || t === "") continue;
    colLabels.push({ key: `col-${c}`, text: String(t), x: x0 + c * pitch + cell / 2, y: y0 - FLAG_OVERHANG - 5 });
  }

  // Pointer flags: grouped per (cell, side) and laid side by side, centred on the cell.
  const groups = new Map<string, Array<{ p: GridPointer; r: number; c: number; w: number }>>();
  const order: string[] = [];
  const keySeen = new Map<string, number>();
  for (const p of scene.pointers ?? []) {
    if (!fin(p.r) || !fin(p.c)) continue;
    const r = Math.round(p.r);
    const c = Math.round(p.c);
    if (r < 0 || r >= R || c < 0 || c >= C) continue;
    const side = p.role === "ptrA" ? "below" : "above";
    const g = `${r},${c}|${side}`;
    if (!groups.has(g)) {
      groups.set(g, []);
      order.push(g);
    }
    groups.get(g)!.push({ p, r, c, w: Math.max(30, p.name.length * 7 + 24) });
  }
  const flags: GridFlagGeom[] = [];
  const rings: GridRingGeom[] = [];
  for (const g of order) {
    const items = groups.get(g)!;
    const side: "above" | "below" = g.endsWith("below") ? "below" : "above";
    const total = items.reduce((s, it) => s + it.w, 0) + FLAG_GAP * (items.length - 1);
    let cursor = -total / 2;
    for (const it of items) {
      const cx = x0 + it.c * pitch + cell / 2 + cursor + it.w / 2;
      cursor += it.w + FLAG_GAP;
      const y = side === "above" ? y0 + it.r * pitch : y0 + it.r * pitch + cell;
      const n = keySeen.get(it.p.name) ?? 0;
      keySeen.set(it.p.name, n + 1);
      flags.push({
        key: n === 0 ? it.p.name : `${it.p.name}~${n}`,
        name: it.p.name,
        role: it.p.role,
        r: it.r,
        c: it.c,
        side,
        x: cx,
        y,
        w: it.w,
        h: FLAG_H,
        box: { x: cx - it.w / 2, y: y - FLAG_H / 2, w: it.w, h: FLAG_H },
      });
      const hasFocusMark = (marksBy.get(`${it.r},${it.c}`) ?? []).includes("focus");
      if (it.p.role === "focus" && !hasFocusMark && !rings.some((rg) => rg.key === `ring-${it.r},${it.c}`)) {
        rings.push({
          key: `ring-${it.r},${it.c}`,
          x: x0 + it.c * pitch,
          y: y0 + it.r * pitch,
          w: cell,
          h: cell,
        });
      }
    }
  }

  // Dependency arrows: pulled in from both centres so they clear the values.
  const arrows: GridArrowGeom[] = [];
  const arrowSeen = new Map<string, number>();
  for (const a of scene.arrows ?? []) {
    const [fr, fc] = a.from ?? [NaN, NaN];
    const [tr, tc] = a.to ?? [NaN, NaN];
    if (![fr, fc, tr, tc].every(fin)) continue;
    if (fr < 0 || fr >= R || tr < 0 || tr >= R || fc < 0 || fc >= C || tc < 0 || tc >= C) continue;
    if (Math.round(fr) === Math.round(tr) && Math.round(fc) === Math.round(tc)) continue;
    const ax = x0 + Math.round(fc) * pitch + cell / 2;
    const ay = y0 + Math.round(fr) * pitch + cell / 2;
    const bx = x0 + Math.round(tc) * pitch + cell / 2;
    const by = y0 + Math.round(tr) * pitch + cell / 2;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    const trim = Math.max(0, Math.min(cell * 0.34, (len - 10) / 2));
    const base = `${Math.round(fr)},${Math.round(fc)}->${Math.round(tr)},${Math.round(tc)}`;
    const n = arrowSeen.get(base) ?? 0;
    arrowSeen.set(base, n + 1);
    arrows.push({
      key: n === 0 ? base : `${base}~${n}`,
      p0: { x: ax + ux * trim, y: ay + uy * trim },
      p1: { x: bx - ux * trim, y: by - uy * trim },
      curve: ARROW_CURVE,
      seed: seedOf(Math.round(fr) * 31 + Math.round(fc) * 7 + Math.round(tr) * 13 + Math.round(tc)),
    });
  }

  const height = y0 + gridH + FLAG_OVERHANG + m.padBottom;

  return {
    kind: "grid",
    density,
    width,
    height,
    rows: R,
    cols: C,
    cell,
    pitch,
    x0,
    y0,
    gridW,
    gridH,
    cells,
    rowLabels,
    colLabels,
    rowLabelW,
    label: labelText ? { text: labelText, x: x0 - (hasRowLabels ? rowLabelW + 10 : 0) - 16, y: y0 + gridH / 2 } : undefined,
    flags,
    rings,
    arrows,
  };
}

// ---------------------------------------------------------------------------
// Note targets: cell:<r>,<c>  row:<r>  col:<c>  ptr:<name>
// ---------------------------------------------------------------------------

const centreOf = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function resolveGridTarget(scene: GridScene, layout: GridLayout, target: string): TargetInfo | null {
  void scene;
  const i = target.indexOf(":");
  const kind = (i < 0 ? target : target.slice(0, i)).trim();
  const id = i < 0 ? "" : target.slice(i + 1).trim();

  if (kind === "ptr") {
    const f = layout.flags.find((p) => p.name === id);
    return f ? { ...centreOf(f.box), box: f.box, side: f.side } : null;
  }

  if (kind === "cell") {
    const [rs, cs] = id.split(",");
    const r = Number(rs);
    const c = Number(cs);
    if (rs === undefined || cs === undefined || !Number.isInteger(r) || !Number.isInteger(c)) return null;
    const cell = layout.cells.find((g) => g.r === r && g.c === c);
    if (!cell) return null;
    const box: Box = { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
    const flagged = layout.flags.some((f) => f.r === r && f.c === c);
    return { ...centreOf(box), box, tipDx: flagged ? cell.w * 0.3 : 0 };
  }

  if (kind === "row") {
    const r = Number(id);
    if (id === "" || !Number.isInteger(r) || r < 0 || r >= layout.rows) return null;
    // Points into the left margin beside the row (where its label is).
    const w = Math.max(layout.rowLabelW, 14) + 12;
    const box: Box = { x: layout.x0 - w, y: layout.y0 + r * layout.pitch, w, h: layout.cell };
    return { ...centreOf(box), box };
  }

  if (kind === "col") {
    const c = Number(id);
    if (id === "" || !Number.isInteger(c) || c < 0 || c >= layout.cols) return null;
    // Points at the column label band above the first row.
    const box: Box = { x: layout.x0 + c * layout.pitch, y: layout.y0 - 22, w: layout.cell, h: 20 };
    return { ...centreOf(box), box, side: "above" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Screen-reader summary
// ---------------------------------------------------------------------------

export function describeGrid(scene: GridScene): string {
  const data = scene.rows ?? [];
  const R = data.length;
  const C = data.reduce((best, row) => Math.max(best, row?.length ?? 0), 0);
  if (R === 0 || C === 0) return `${scene.label ? `${scene.label}: ` : ""}Empty grid.`;

  const marksBy = new Map<string, MarkRole[]>();
  for (const mk of scene.marks ?? []) {
    const key = `${mk.r},${mk.c}`;
    marksBy.set(key, [...(marksBy.get(key) ?? []), mk.role]);
  }
  const cellText = (r: number, c: number) => {
    const v = data[r]?.[c];
    const t = v === null || v === undefined ? "empty" : v === "#" ? "wall" : String(v);
    const marks = marksBy.get(`${r},${c}`);
    return marks && marks.length ? `${t} (${marks.join(", ")})` : t;
  };
  const rows: string[] = [];
  for (let r = 0; r < R; r++) {
    const name = scene.rowLabels?.[r] ? `Row ${scene.rowLabels[r]}` : `Row ${r}`;
    const vals = Array.from({ length: C }, (_, c) => cellText(r, c));
    rows.push(`${name}: ${vals.join(", ")}`);
  }

  const parts = [
    `${scene.label ? `${scene.label}, a ` : "A "}grid of ${R} row${R === 1 ? "" : "s"} by ${C} column${C === 1 ? "" : "s"}.`,
    rows.join(". ") + ".",
  ];
  if (scene.colLabels?.some(Boolean)) parts.push(`Columns: ${scene.colLabels.join(", ")}.`);
  const ptrs = (scene.pointers ?? []).map((p) => `${p.name} at row ${p.r}, column ${p.c}`);
  if (ptrs.length) parts.push(`Pointers: ${ptrs.join("; ")}.`);
  const arrows = scene.arrows ?? [];
  if (arrows.length) {
    const shown = arrows.slice(0, 6).map((a) => `row ${a.from[0]}, column ${a.from[1]} to row ${a.to[0]}, column ${a.to[1]}`);
    parts.push(`Dependencies: ${shown.join("; ")}${arrows.length > 6 ? `; and ${arrows.length - 6} more` : ""}.`);
  }
  return parts.join(" ");
}
