/**
 * Which frames set the height of a run's scene area?
 *
 * Scenes change size between frames (pointer tags stack, notes appear, a tree
 * grows). To keep the page steady while stepping, the stage keeps invisible
 * copies of the tallest frames in the same grid cell as the live scene, so the
 * cell is always as tall as the run's tallest frame at the current width.
 *
 * This file only chooses those frames. It estimates each frame's rendered
 * height with the pure layout functions (no DOM) at a handful of container
 * widths and keeps the winner at each width. Pure and cheap: layouts are
 * computed once per frame.
 */
import type { Annotation, Frame, Scene } from "@/lib/engine/types";
import { layoutScene, planNotes, type Density } from "./layout";

/** Container widths (px) the estimate is taken at: a phone up to the wide column. */
const PROBE_WIDTHS = [250, 320, 400, 500, 620, 760, 940];

/** Row layout: a part keeps at least this width before it wraps (see CompositeScene). */
const PART_MIN = 280;

interface Size {
  /** Natural viewBox width, and the total height including the note bands. */
  w: number;
  h: number;
}

type Leaf = Exclude<Scene, { kind: "composite" }>;

function leafSize(scene: Leaf, density: Density, minNoteRows: number): Size {
  const layout = layoutScene(scene, density);
  if (layout.kind === "composite") return { w: 1, h: 0 };
  const notes: Annotation[] = scene.annotations ?? [];
  const plan = planNotes(scene, layout, notes, density, { minTopRows: minNoteRows });
  return { w: layout.width, h: layout.height + plan.top + plan.bottom };
}

/** Height an svg of this natural size takes in a container `cw` wide (it never grows past its width). */
function drawn(size: Size, cw: number): number {
  return size.h * (Math.min(cw, size.w) / size.w);
}

const CAPTION = 26;

/** A frame's scene reduced to the sizes the estimate needs, measured once. */
type Measured =
  | { kind: "leaf"; size: Size }
  | { kind: "composite"; column: boolean; gap: number; parts: Array<{ size: Size; cap: number }> };

function measure(scene: Scene, density: Density, minNoteRows: number): Measured {
  if (scene.kind !== "composite") return { kind: "leaf", size: leafSize(scene, density, minNoteRows) };
  return {
    kind: "composite",
    column: scene.layout === "column",
    gap: density === "compact" ? 12 : 20,
    parts: scene.parts.map((p) => ({
      size: leafSize(p.scene, density, minNoteRows),
      cap: p.title ? CAPTION : 0,
    })),
  };
}

function estimate(m: Measured, cw: number): number {
  if (m.kind === "leaf") return drawn(m.size, cw);
  const { parts, gap } = m;
  if (parts.length === 0) return 0;
  if (m.column) return parts.reduce((sum, p) => sum + p.cap + drawn(p.size, cw), 0) + gap * (parts.length - 1);
  const perLine = Math.max(1, Math.floor((cw + gap) / (PART_MIN + gap)));
  let total = 0;
  for (let i = 0; i < parts.length; i += perLine) {
    const line = parts.slice(i, i + perLine);
    const partW = (cw - gap * (line.length - 1)) / line.length;
    total += Math.max(...line.map((p) => p.cap + drawn(p.size, partW)));
    if (i + perLine < parts.length) total += gap;
  }
  return total;
}

/**
 * Indices of the frames whose scene, rendered invisibly, keeps the scene area
 * at the run's tallest height. Usually one to three frames.
 */
export function tallestSceneFrames(frames: readonly Frame[], density: Density, minNoteRows: number): number[] {
  if (frames.length <= 1) return [];
  const measured: Array<Measured | null> = frames.map((f) => {
    try {
      return measure(f.scene, density, minNoteRows);
    } catch {
      return null;
    }
  });
  const chosen = new Set<number>();
  for (const cw of PROBE_WIDTHS) {
    let best = -1;
    let bestH = -1;
    measured.forEach((m, i) => {
      if (!m) return;
      const h = estimate(m, cw);
      if (h > bestH + 0.5) {
        best = i;
        bestH = h;
      }
    });
    if (best >= 0) chosen.add(best);
  }
  return Array.from(chosen).sort((a, b) => a - b);
}
