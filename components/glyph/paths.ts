import type { GlyphId } from '@/types/learning';

/**
 * Pattern "shape language": one single-stroke, pen-drawn glyph per lesson.
 *
 * Every glyph lives in a 24x24 viewBox, is drawn with round caps/joins in
 * `currentColor`, and is designed for a ~1.75 stroke. Rules of the family:
 *  - at most 4 strokes (path elements), >= 2 units of clearance between strokes
 *  - corner radius 1.2-2.4 on boxes, node radius 2-3
 *  - the only fills are tiny dots
 *
 * Path strings are built with small helpers below so geometry stays exact;
 * the output is plain data (no runtime deps) and is evaluated once at import.
 */
export interface GlyphDef {
  /** Stroked outlines, in drawing order. */
  paths: string[]
  /** Secondary strokes rendered dashed (the "ghost" layer, e.g. a bigger home). */
  dashed?: string[]
  /** Tiny filled dots, as [cx, cy]. */
  dots?: Array<[number, number]>
  /** Accessible name, also the hover tooltip. */
  title: string
}

export type GlyphKey = GlyphId | 'generic'

// ---------------------------------------------------------------- helpers
const n = (v: number) => String(Math.round(v * 100) / 100)

/** Closed circle as a path. */
const circ = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`

/** Rounded rectangle as a closed path. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}V${n(y + h - r)}` +
  `a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}H${n(x + r)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}` +
  `V${n(y + r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}Z`

type Pt = [number, number]

/** Straight edge between two circular nodes, trimmed to the node outlines. */
const edge = (a: Pt, ra: number, b: Pt, rb: number) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  return `M${n(a[0] + ux * ra)} ${n(a[1] + uy * ra)}L${n(b[0] - ux * rb)} ${n(b[1] - uy * rb)}`
}

/** Open arrowhead ("v" shape) whose tip is at (tx, ty) travelling at `deg` (0 = right, 90 = down). */
const head = (tx: number, ty: number, deg: number, len = 2.4) => {
  const rad = (deg * Math.PI) / 180
  const spread = (38 * Math.PI) / 180
  const p = (sign: number): Pt => [
    tx - len * Math.cos(rad + sign * spread),
    ty - len * Math.sin(rad + sign * spread),
  ]
  const [x1, y1] = p(1)
  const [x2, y2] = p(-1)
  return `M${n(x1)} ${n(y1)}L${n(tx)} ${n(ty)}L${n(x2)} ${n(y2)}`
}

// ----------------------------------------------------------------- shapes
const treeRoot: Pt = [12, 4.5]
const treeL: Pt = [6.5, 12]
const treeR: Pt = [17.5, 12]
const treeLL: Pt = [3.5, 19.5]
const treeLR: Pt = [9.5, 19.5]

const bstRoot: Pt = [12, 5]
const bstL: Pt = [6, 12.5]
const bstR: Pt = [18, 12.5]

const heapRoot: Pt = [12, 9.8]
const heapL: Pt = [5.8, 18.8]
const heapR: Pt = [18.2, 18.8]

const gA: Pt = [5, 6.5]
const gB: Pt = [18.5, 5]
const gC: Pt = [6.5, 19]
const gD: Pt = [19, 18]

export const GLYPHS: Record<GlyphKey, GlyphDef> = {
  // --- Data structures -------------------------------------------------
  // Three boxes in a row, with an index tick under each.
  arrays: {
    title: 'Array: a row of boxes',
    paths: [rr(3, 7.5, 18, 9, 2.2), 'M9 7.5V16.5M15 7.5V16.5'],
    dots: [[6, 20.2], [12, 20.2], [18, 20.2]],
  },

  // Three boxes sitting inside a dashed, bigger home it can grow into.
  vectors: {
    title: 'Vector: an array that grows into a bigger box',
    paths: [rr(6, 9, 12, 6, 1.6), 'M10 9V15M14 9V15'],
    dashed: [rr(2.5, 5, 19, 14, 2.8)],
  },

  // Boxes of characters, threaded on a wavy string.
  strings: {
    title: 'String: characters on a thread',
    paths: [rr(3, 10.5, 18, 8, 2.2), 'M9 10.5V18.5M15 10.5V18.5', 'M3 6q2.25-3 4.5 0t4.5 0 4.5 0 4.5 0'],
  },

  // Node -> node -> node, each handing over to the next.
  'linked-lists': {
    title: 'Linked list: nodes pointing to the next',
    paths: [
      circ(4, 12, 2),
      circ(12, 12, 2),
      circ(20, 12, 2),
      `M6.3 12H9.7${head(9.7, 12, 0, 2.2)}M14.3 12H17.7${head(17.7, 12, 0, 2.2)}`,
    ],
  },

  // Three plates piled up, last on goes first off (arrow up).
  stacks: {
    title: 'Stack: plates piled up, pop from the top',
    paths: [rr(3, 5.8, 12, 3.2, 1.2), rr(3, 11.2, 12, 3.2, 1.2), rr(3, 16.6, 12, 3.2, 1.2), `M19.2 20V4${head(19.2, 4, -90, 2.6)}`],
  },

  // Standing in line, flow left to right: join at the back, leave at the front.
  queues: {
    title: 'Queue: a line moving forward',
    paths: [rr(4, 4.5, 3.4, 9, 1.4), rr(10, 4.5, 3.4, 9, 1.4), rr(16, 4.5, 3.4, 9, 1.4), `M6 18.5H20.5${head(20.5, 18.5, 0, 2.6)}`],
    dots: [[3.4, 18.5]],
  },

  // A key goes in; the hash picks one of three buckets.
  'hash-maps': {
    title: 'Hash map: a key lands in one bucket',
    paths: [circ(4.5, 12, 2.2), `M6.9 12H14.2${head(14.2, 12, 0, 2.4)}`, rr(16, 3.2, 5, 4, 1.2), rr(16, 10, 5, 4, 1.2), rr(16, 16.8, 5, 4, 1.2)],
  },

  // Root, two children, and a little more below the left one.
  trees: {
    title: 'Tree: a root with children',
    paths: [
      `${circ(...treeRoot, 2)}${circ(...treeL, 2)}${circ(...treeR, 2)}${circ(...treeLL, 2)}${circ(...treeLR, 2)}`,
      [edge(treeRoot, 2, treeL, 2), edge(treeRoot, 2, treeR, 2), edge(treeL, 2, treeLL, 2), edge(treeL, 2, treeLR, 2)].join(''),
    ],
  },

  // Left node small, right node big, with < and > marks below.
  bst: {
    title: 'Binary search tree: smaller left, bigger right',
    paths: [
      `${circ(...bstRoot, 2.2)}${circ(...bstL, 1.7)}${circ(...bstR, 2.8)}`,
      `${edge(bstRoot, 2.2, bstL, 1.7)}${edge(bstRoot, 2.2, bstR, 2.8)}`,
      'M7.4 17.5L5 19.6L7.4 21.7M16.6 17.5L19 19.6L16.6 21.7',
    ],
  },

  // A tree wearing a crown: the root is the one you always get.
  heaps: {
    title: 'Heap: the top of the tree is always the best',
    paths: [
      `${circ(...heapRoot, 3)}${circ(...heapL, 2.2)}${circ(...heapR, 2.2)}`,
      `${edge(heapRoot, 3, heapL, 2.2)}${edge(heapRoot, 3, heapR, 2.2)}`,
      'M9.6 4.4L10.3 2.4L12 3.7L13.7 2.4L14.4 4.4Z',
    ],
    dots: [[12, 9.8]],
  },

  // Four dots and lines that cross.
  graphs: {
    title: 'Graph: dots joined by lines',
    paths: [
      `${circ(...gA, 2)}${circ(...gB, 2)}${circ(...gC, 2)}${circ(...gD, 2)}`,
      [edge(gA, 2, gB, 2), edge(gB, 2, gC, 2), edge(gA, 2, gD, 2), edge(gC, 2, gD, 2), edge(gA, 2, gC, 2)].join(''),
    ],
  },

  // One shared trunk, then the path forks into branches.
  tries: {
    title: 'Trie: shared prefix, then branches',
    paths: ['M12 3.8V9.8', 'M12 9.8C12 13.8 5 13.2 5 17.8M12 9.8V17.8M12 9.8C12 13.8 19 13.2 19 17.8', `${circ(5, 19.6, 1.8)}${circ(12, 19.6, 1.8)}${circ(19, 19.6, 1.8)}`],
    dots: [[12, 3.8], [12, 9.8]],
  },

  // --- Techniques ------------------------------------------------------
  // Two arrows walking toward each other over the data, about to meet.
  'two-pointers': {
    title: 'Two pointers: converging from both ends',
    paths: ['M3 9H9.5' + head(9.5, 9, 0, 2.4), 'M21 9H14.5' + head(14.5, 9, 180, 2.4), 'M3 17.5H21'],
    dots: [[12, 9]],
  },

  // A bracket framing part of a row; slide it along.
  'sliding-window': {
    title: 'Sliding window: a frame over part of a row',
    paths: [rr(3, 13.5, 18, 6.5, 2.2), 'M7.5 13.5V20M12 13.5V20M16.5 13.5V20', 'M7.5 10.8V7.5H16.5V10.8'],
  },

  // A loop (rho) with two runners, one well ahead of the other.
  'fast-and-slow-pointers': {
    title: 'Fast and slow pointers: two runners on a loop',
    paths: [circ(13.5, 14.5, 6.5), 'M3.5 4.5L8.9 10'],
    dots: [[19.1, 17.8], [17.8, 9.4]],
  },

  // A rising staircase of running totals.
  'prefix-sum': {
    title: 'Prefix sum: running totals climb',
    paths: ['M3 20H8V15.5H13V11H18V6.5H21'],
    dots: [[5.5, 16.4], [10.5, 11.9], [15.5, 7.4]],
  },

  // A bar cut in half, with a marker dropping on the middle.
  'binary-search': {
    title: 'Binary search: cut the range in half',
    paths: [rr(3, 12.5, 18, 7, 2.2), 'M12 12.5V19.5', `M12 3V9.6${head(12, 9.6, 90, 2.6)}`],
  },

  // Bars climbing in height, in order.
  sorting: {
    title: 'Sorting: bars in increasing order',
    paths: ['M5.5 20V15', 'M10 20V11.5', 'M14.5 20V8', 'M19 20V4.5'],
  },

  // A magnifier hovering over a row of cells.
  searching: {
    title: 'Searching: a magnifier over the data',
    paths: [circ(9, 8.5, 4.5), 'M12.3 11.8L15.6 15.1', rr(3, 17.8, 18, 4, 1.5), 'M9 17.8V21.8M15 17.8V21.8'],
  },

  // A square spiral: the same shape, nested inside itself.
  recursion: {
    title: 'Recursion: the same shape inside itself',
    paths: ['M3 4H20V20H5V9H15V15H10V12'],
  },

  // BFS ripples out from a point; DFS dives down one winding path.
  'bfs-dfs': {
    title: 'BFS and DFS: ripples versus a deep path',
    paths: ['M7.57 8.94A4 4 0 0 1 7.57 15.06', 'M10.46 5.49A8.5 8.5 0 0 1 10.46 18.51', 'M17 3.5L20 7.5L16.2 11.5L20 15.5L16.5 19.5'],
    dots: [[5, 12]],
  },

  // A claw closing on the coin that is best right now.
  greedy: {
    title: 'Greedy: grab the best one right now',
    paths: ['M12 2.5V6.2', 'M12 6.2C8 6.2 6.2 9 6.6 13.5M12 6.2C16 6.2 17.8 9 17.4 13.5', circ(12, 15, 2.8), 'M5 20.5H19'],
  },

  // A small grid of answers; the empty cell is built from filled neighbours.
  'dynamic-programming': {
    title: 'Dynamic programming: build from filled cells',
    paths: [rr(3, 3, 18, 18, 2.5), 'M9 3V21M15 3V21M3 9H21M3 15H21', 'M10.3 10.3L13.7 13.7M13.7 11V13.7H11'],
    dots: [[6, 6], [12, 6], [6, 12]],
  },

  // Neutral fallback for unknown slugs: a notebook ring with a dot.
  generic: {
    title: 'Lesson',
    paths: [circ(12, 12, 8), rr(8, 8, 8, 8, 2.4)],
  },
}
