import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

import { PATTERN_GRAPH } from './graph';

export interface Placed {
  x: number
  y: number
}

export interface MapLayout {
  width: number
  height: number
  positions: Map<string, Placed>
}

export const NODE_R = 28;
const PAD_X = 64;
const PAD_TOP = 48;
const PAD_BOTTOM = 84;
const ROW_GAP = 150;

type SimNode = SimulationNodeDatum & { id: string; level: number; group: string; tx: number; ty: number };

/** Small seeded generator so the same width always gives the same map. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Runs the d3 force simulation to completion, synchronously, and returns the final
 * positions. Nothing animates and nothing keeps running, so it is the same for
 * reduced-motion users. Rows follow learning order (top to bottom); data
 * structures lean left, algorithms lean right.
 */
export function computeLayout(width: number): MapLayout {
  const { nodes, edges, maxLevel } = PATTERN_GRAPH;
  const height = PAD_TOP + PAD_BOTTOM + maxLevel * ROW_GAP;

  // Each group gets its own band (data structures left, algorithms right). Within a band,
  // lessons that share a row are spaced evenly, and neighbours are staggered up and down so
  // their labels don't collide. The force simulation then relaxes this toward the links.
  const mid = width / 2;
  const bands: Record<string, [number, number]> = {
    'data-structures': [PAD_X, mid - 24],
    algorithms: [mid + 24, width - PAD_X],
  };
  const rowCount = new Map<string, number>();
  const rowSeen = new Map<string, number>();
  for (const n of nodes) rowCount.set(`${n.group}:${n.level}`, (rowCount.get(`${n.group}:${n.level}`) ?? 0) + 1);

  const simNodes: SimNode[] = nodes.map((n) => {
    const key = `${n.group}:${n.level}`;
    const k = rowSeen.get(key) ?? 0;
    rowSeen.set(key, k + 1);
    const count = rowCount.get(key) ?? 1;
    const [x0, x1] = bands[n.group] ?? [PAD_X, width - PAD_X];
    const targetX = count === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * k) / (count - 1);
    const stagger = count > 2 ? (k % 2 === 0 ? -22 : 22) : 0;
    return { id: n.id, level: n.level, group: n.group, tx: targetX, ty: PAD_TOP + n.level * ROW_GAP + stagger, x: targetX, y: PAD_TOP + n.level * ROW_GAP + stagger };
  });
  const links: Array<SimulationLinkDatum<SimNode> & { kind: string }> = edges.map((e) => ({
    source: e.source,
    target: e.target,
    kind: e.kind,
  }));

  const simulation = forceSimulation(simNodes)
    .randomSource(seeded(7))
    .force(
      'link',
      forceLink<SimNode, (typeof links)[number]>(links)
        .id((d) => d.id)
        .distance((l) => (l.kind === 'prereq' ? ROW_GAP * 0.8 : ROW_GAP * 1.1))
        .strength((l) => (l.kind === 'prereq' ? 0.05 : 0.01)),
    )
    .force('charge', forceManyBody().strength(-340))
    .force('x', forceX<SimNode>((d) => d.tx).strength(0.4))
    .force('y', forceY<SimNode>((d) => d.ty).strength(0.6))
    .force('collide', forceCollide<SimNode>(NODE_R + 26).iterations(3))
    .stop();

  simulation.tick(320);

  const positions = new Map<string, Placed>();
  for (const n of simNodes) {
    positions.set(n.id, {
      x: Math.min(width - PAD_X, Math.max(PAD_X, n.x ?? width / 2)),
      y: Math.min(height - PAD_BOTTOM, Math.max(PAD_TOP, n.y ?? PAD_TOP)),
    });
  }
  return { width, height, positions };
}
