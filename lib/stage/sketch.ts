/**
 * Deterministic "hand-drawn" SVG path helpers.
 *
 * Everything here is a pure function of its arguments and a seed: the same
 * seed always produces the identical path string (no Math.random), so SSR and
 * client renders agree and re-renders never "shimmer".
 *
 * Wobble is deliberately subtle: at roughness 1 no point of a path strays more
 * than about 1.2px from the ideal geometry.
 *
 * Every helper emits a fixed command structure for a given kind of shape
 * (e.g. `M Q` for lines and arrows), so framer-motion can interpolate the `d`
 * attribute between two calls.
 */

export interface Point {
  x: number;
  y: number;
}

export interface SketchOpts {
  /** Any integer. Same seed -> same output. Default 1. */
  seed?: number;
  /** 0 = ruler-straight, 1 = default hand-drawn, capped at 2. */
  roughness?: number;
}

/** mulberry32: tiny, fast, well-distributed seeded PRNG returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Spread small integer seeds apart so seed 1 and seed 2 do not look alike. */
function makeRng(seed: number | undefined): () => number {
  const s = Math.trunc(Number.isFinite(seed as number) ? (seed as number) : 1);
  const rng = mulberry32((Math.imul(s, 0x9e3779b1) ^ 0x85ebca6b) >>> 0);
  rng(); // discard the first, weakly mixed value
  return rng;
}

function rough(r: number | undefined): number {
  if (r === undefined || !Number.isFinite(r)) return 1;
  return Math.min(2, Math.max(0, r));
}

/** Rounded to 2dp; avoids "-0". */
function n(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(r === 0 ? 0 : r);
}

/** Symmetric jitter in [-amp, amp]. */
function jit(rng: () => number, amp: number): number {
  return (rng() * 2 - 1) * amp;
}

// Wobble budget at roughness 1 (px). Worst case per path: endpoint jitter
// (<= 0.25 per axis -> 0.35) + curve bulge (<= 0.8) = 1.15 < 1.2.
const END_JITTER = 0.25;
const CTRL_OFFSET = 1.6; // control offset; a quadratic bulges by half of it

// ---------------------------------------------------------------------------
// Line
// ---------------------------------------------------------------------------

/** A slightly bowed line from (x1,y1) to (x2,y2): `M x y Q cx cy x y`. */
export function sketchLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: SketchOpts = {},
): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const len = Math.hypot(x2 - x1, y2 - y1);
  // Short lines wobble less so they do not look like a squiggle.
  const scale = k * Math.min(1, len / 40);

  // Always draw the same number of random values -> stable structure.
  const j = [rng(), rng(), rng(), rng(), rng()].map((v) => v * 2 - 1);
  const ax = x1 + j[0] * END_JITTER * scale;
  const ay = y1 + j[1] * END_JITTER * scale;
  const bx = x2 + j[2] * END_JITTER * scale;
  const by = y2 + j[3] * END_JITTER * scale;

  const nx = len > 1e-6 ? -(y2 - y1) / len : 0;
  const ny = len > 1e-6 ? (x2 - x1) / len : 1;
  const off = j[4] * CTRL_OFFSET * scale;
  const cx = (x1 + x2) / 2 + nx * off;
  const cy = (y1 + y2) / 2 + ny * off;

  return `M${n(ax)} ${n(ay)}Q${n(cx)} ${n(cy)} ${n(bx)} ${n(by)}`;
}

// ---------------------------------------------------------------------------
// Rectangle
// ---------------------------------------------------------------------------

export interface SketchRectOpts extends SketchOpts {
  /** Corner radius, clamped to half the shorter side. */
  radius?: number;
}

/** A closed, rounded, slightly wobbly rectangle. */
export function sketchRect(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: SketchRectOpts = {},
): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const r = Math.max(0, Math.min(opts.radius ?? 0, w / 2, h / 2));
  const cj = 0.3 * k; // anchor jitter per axis
  const sj = 0.9 * k; // side control offset; with anchor jitter, control points stay within 1.2

  const p = (px: number, py: number) => ({
    x: px + jit(rng, cj),
    y: py + jit(rng, cj),
  });

  // 8 anchors going clockwise from the top-left, then 4 corner controls.
  const a0 = p(x + r, y);
  const a1 = p(x + w - r, y);
  const a2 = p(x + w, y + r);
  const a3 = p(x + w, y + h - r);
  const a4 = p(x + w - r, y + h);
  const a5 = p(x + r, y + h);
  const a6 = p(x, y + h - r);
  const a7 = p(x, y + r);
  const c0 = p(x + w, y);
  const c1 = p(x + w, y + h);
  const c2 = p(x, y + h);
  const c3 = p(x, y);

  const side = (from: Point, to: Point, nxs: number, nys: number): Point => ({
    x: (from.x + to.x) / 2 + nxs * jit(rng, sj),
    y: (from.y + to.y) / 2 + nys * jit(rng, sj),
  });
  const s0 = side(a0, a1, 0, 1);
  const s1 = side(a2, a3, 1, 0);
  const s2 = side(a4, a5, 0, 1);
  const s3 = side(a6, a7, 1, 0);

  const q = (c: Point, e: Point) => `Q${n(c.x)} ${n(c.y)} ${n(e.x)} ${n(e.y)}`;
  return (
    `M${n(a0.x)} ${n(a0.y)}` +
    q(s0, a1) +
    q(c0, a2) +
    q(s1, a3) +
    q(c1, a4) +
    q(s2, a5) +
    q(c2, a6) +
    q(s3, a7) +
    q(c3, a0) +
    "Z"
  );
}

// ---------------------------------------------------------------------------
// Circle
// ---------------------------------------------------------------------------

/** A closed, slightly wobbly circle from four cubic segments. */
export function sketchCircle(
  cx: number,
  cy: number,
  r: number,
  opts: SketchOpts = {},
): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const kappa = 0.5522847498;
  const j = () => jit(rng, 0.3 * k);
  const top = { x: cx + j(), y: cy - r + j() };
  const right = { x: cx + r + j(), y: cy + j() };
  const bottom = { x: cx + j(), y: cy + r + j() };
  const left = { x: cx - r + j(), y: cy + j() };
  const d = r * kappa;
  const c = (px: number, py: number) => `${n(px)} ${n(py)}`;
  return (
    `M${c(top.x, top.y)}` +
    `C${c(top.x + d, top.y)} ${c(right.x, right.y - d)} ${c(right.x, right.y)}` +
    `C${c(right.x, right.y + d)} ${c(bottom.x + d, bottom.y)} ${c(bottom.x, bottom.y)}` +
    `C${c(bottom.x - d, bottom.y)} ${c(left.x, left.y + d)} ${c(left.x, left.y)}` +
    `C${c(left.x, left.y - d)} ${c(top.x - d, top.y)} ${c(top.x, top.y)}` +
    "Z"
  );
}

// ---------------------------------------------------------------------------
// Bracket
// ---------------------------------------------------------------------------

export interface SketchBracketOpts extends SketchOpts {
  /** How far the two end ticks reach toward the cells. Default 8. */
  depth?: number;
  /**
   * `below`: the bar runs along y with ticks pointing up at cells above it.
   * `above`: the bar runs along y with ticks pointing down at cells below it.
   */
  side?: "below" | "above";
}

/** A square-ish window bracket spanning x1..x2: tick, bar, tick (`M Q Q Q`). */
export function sketchBracket(
  x1: number,
  x2: number,
  y: number,
  opts: SketchBracketOpts = {},
): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  const depth = opts.depth ?? 8;
  const dir = opts.side === "above" ? 1 : -1; // tick direction on screen
  const tickY = y + dir * depth;
  const rr = Math.min(5, (hi - lo) / 2, depth);

  const e = (amp: number) => jit(rng, amp * k);
  const start = { x: lo + e(0.25), y: tickY + e(0.25) };
  const a = { x: lo + rr + e(0.2), y: y + e(0.25) };
  const b = { x: hi - rr + e(0.2), y: y + e(0.25) };
  const end = { x: hi + e(0.25), y: tickY + e(0.25) };
  const mid = { x: (lo + hi) / 2 + e(2), y: y + e(1.2) }; // bar bulge <= 0.6

  return (
    `M${n(start.x)} ${n(start.y)}` +
    `Q${n(lo)} ${n(y)} ${n(a.x)} ${n(a.y)}` +
    `Q${n(mid.x)} ${n(mid.y)} ${n(b.x)} ${n(b.y)}` +
    `Q${n(hi)} ${n(y)} ${n(end.x)} ${n(end.y)}`
  );
}

// ---------------------------------------------------------------------------
// Underline
// ---------------------------------------------------------------------------

/** A wobbly underline starting at the origin and running `width` px to the right. */
export function sketchUnderline(width: number, opts: SketchOpts = {}): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const w = Math.max(0, width);
  const scale = k * Math.min(1, w / 40);
  const y0 = jit(rng, 0.3 * scale);
  const y1 = jit(rng, 0.3 * scale);
  const cy = jit(rng, CTRL_OFFSET * scale);
  return `M0 ${n(y0)}Q${n(w / 2)} ${n(cy)} ${n(w)} ${n(y1)}`;
}

// ---------------------------------------------------------------------------
// Arrow shaft
// ---------------------------------------------------------------------------

export interface SketchArrowOpts extends SketchOpts {
  /**
   * Bend as a fraction of the shaft length. 0 = straight. Positive bulges
   * clockwise on screen (travelling right, the shaft sags downward); negative
   * bulges the other way. 0.3 is a gentle arc.
   */
  curve?: number;
}

/**
 * Shaft of an arrow from `from` to `to` (`M Q`, always the same structure, so
 * it interpolates). The head is drawn by an SVG marker on the path end.
 */
export function sketchArrow(
  from: Point,
  to: Point,
  opts: SketchArrowOpts = {},
): string {
  const rng = makeRng(opts.seed);
  const k = rough(opts.roughness);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const scale = k * Math.min(1, len / 40);

  const j = [rng(), rng(), rng(), rng(), rng()].map((v) => v * 2 - 1);
  const ax = from.x + j[0] * END_JITTER * scale;
  const ay = from.y + j[1] * END_JITTER * scale;
  const bx = to.x + j[2] * END_JITTER * scale;
  const by = to.y + j[3] * END_JITTER * scale;

  const nx = len > 1e-6 ? -(to.y - from.y) / len : 0;
  const ny = len > 1e-6 ? (to.x - from.x) / len : 1;
  // Quadratic midpoint bulge = half the control offset, so offset = 2 * bulge.
  const bulge = (opts.curve ?? 0) * len;
  const off = 2 * bulge + j[4] * CTRL_OFFSET * scale;
  const cx = (from.x + to.x) / 2 + nx * off;
  const cy = (from.y + to.y) / 2 + ny * off;

  return `M${n(ax)} ${n(ay)}Q${n(cx)} ${n(cy)} ${n(bx)} ${n(by)}`;
}

// ---------------------------------------------------------------------------
// Zigzag (error cue)
// ---------------------------------------------------------------------------

/** Evenly spaced zigzag polyline starting at (x, y), `width` px long. Not random. */
export function zigzag(
  x: number,
  y: number,
  width: number,
  opts: { amp?: number; step?: number } = {},
): string {
  const amp = opts.amp ?? 2.5;
  const step = Math.max(2, opts.step ?? 5);
  const count = Math.max(1, Math.round(width / step));
  const dx = width / count;
  let d = `M${n(x)} ${n(y)}`;
  for (let i = 1; i <= count; i++) {
    d += `L${n(x + dx * i)} ${n(y + (i % 2 === 1 ? -amp : amp))}`;
  }
  return d;
}
