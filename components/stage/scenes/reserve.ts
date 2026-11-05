/**
 * Which frames set the height of a run's scene area?
 *
 * Scenes change size between frames (pointer tags stack, notes appear, a tree
 * grows). To keep the page steady while stepping, the scene box has a fixed
 * height: the run's tallest frame at the stage's width. This file estimates it
 * with the pure layout functions (no DOM, no hidden copies of the svg) for a
 * handful of stage widths; the stage hands the numbers to CSS.
 */
import type { Annotation, Frame, Scene } from "@/lib/engine/types";
import { layoutScene, planNotes, type Density } from "./layout";

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
 * Stage widths (px, upper bound of each bucket) the scene box is sized for. The
 * first six are the single-column layout, the last three the two-column one
 * (stage >= 900px). The stage turns each into a CSS container-query rule, so
 * the right height is already on the first paint at any width.
 */
export const STAGE_BUCKETS = [359, 439, 539, 659, 759, 839, 959, 1099, 1280] as const;
/** First bucket index that uses the two-column layout. */
export const SPLIT_FROM = 5;

/** Stage card padding (both sides) and the scene box padding (both sides), px. Keep in step with stage.module.css. */
const CARD_PAD = 32;
const BOX_PAD = 32;
const SPLIT_GAP = 24;
const SPLIT_SHARE = 0.6;

/** Width the scene gets inside the box for a stage `w` wide. */
function sceneWidth(w: number, split: boolean): number {
  const inner = w - CARD_PAD;
  return (split ? (inner - SPLIT_GAP) * SPLIT_SHARE : inner) - BOX_PAD;
}

/**
 * Height (px, numbers only, no DOM) of the tallest frame's scene for each stage
 * width bucket. Computed from the pure layout functions, once per run.
 */
export function sceneHeightBuckets(
  frames: readonly Frame[],
  density: Density,
  minNoteRows: number,
  allowSplit: boolean,
): number[] {
  const measured: Measured[] = [];
  for (const f of frames) {
    try {
      measured.push(measure(f.scene, density, minNoteRows));
    } catch {
      /* a frame that cannot be measured does not reserve anything */
    }
  }
  return STAGE_BUCKETS.map((w, i) => {
    const cw = Math.max(160, sceneWidth(w, allowSplit && i >= SPLIT_FROM));
    let tallest = 0;
    for (const m of measured) tallest = Math.max(tallest, estimate(m, cw));
    return Math.ceil(tallest) + BOX_PAD;
  });
}
