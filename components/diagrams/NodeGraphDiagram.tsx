'use client';

import { motion } from 'framer-motion';

export type NodeState = 'active' | 'visited' | 'success' | 'fail' | 'compare';

type GNode = { id: string; label: string | number; x: number; y: number };

const STATE_STYLE: Record<NodeState | 'idle', { fill: string; stroke: string; text: string }> = {
  idle: { fill: 'var(--white)', stroke: 'var(--border-strong)', text: 'var(--text-primary)' },
  active: { fill: 'var(--surface-amber)', stroke: 'var(--accent-amber)', text: 'var(--accent-amber)' },
  compare: { fill: 'var(--surface-coral)', stroke: 'var(--accent-coral)', text: 'var(--accent-coral)' },
  visited: { fill: 'var(--surface-teal)', stroke: 'var(--accent-teal)', text: 'var(--accent-teal)' },
  success: { fill: 'var(--accent-teal)', stroke: 'var(--accent-teal)', text: '#fff' },
  fail: { fill: 'var(--surface-danger)', stroke: 'var(--state-danger)', text: 'var(--state-danger)' },
};

function Canvas({
  nodes,
  edges,
  states,
  activeEdges = [],
  directed = false,
  r = 22,
}: {
  nodes: GNode[]
  edges: [string, string][]
  states: Record<string, NodeState>
  activeEdges?: [string, string][]
  directed?: boolean
  r?: number
}) {
  if (!nodes.length) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const pad = r + 12;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad;
  const h = Math.max(...ys) - minY + pad;
  const hot = (a: string, b: string) =>
    activeEdges.some(([p, q]) => (p === a && q === b) || (!directed && p === b && q === a));

  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} width="100%" style={{ maxWidth: Math.min(640, w * 1.6), maxHeight: 340 }}>
      <defs>
        <marker id="ng-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {edges.map(([a, b]) => {
        const p = byId.get(a);
        const q = byId.get(b);
        if (!p || !q) return null;
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const ux = (q.x - p.x) / d;
        const uy = (q.y - p.y) / d;
        const on = hot(a, b);
        const end = r + (directed ? 3 : 0);
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x + ux * r}
            y1={p.y + uy * r}
            x2={q.x - ux * end}
            y2={q.y - uy * end}
            stroke={on ? 'var(--accent-amber)' : 'var(--border-strong)'}
            strokeWidth={on ? 3 : 1.75}
            markerEnd={directed ? 'url(#ng-arrow)' : undefined}
            style={{ transition: 'stroke 250ms' }}
          />
        );
      })}
      {nodes.map((n) => {
        const s = STATE_STYLE[states[n.id] ?? 'idle'];
        return (
          <g key={n.id}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r}
              initial={false}
              animate={{ fill: s.fill, stroke: s.stroke }}
              transition={{ duration: 0.25 }}
              strokeWidth={states[n.id] === 'active' ? 3 : 2}
            />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-dmmono)" fontSize={14} fontWeight={700} fill={s.text}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function asStates(v: unknown): Record<string, NodeState> {
  return v && typeof v === 'object' ? (v as Record<string, NodeState>) : {};
}

/** Binary tree from level-order `cells` (null = gap), or any tree from diagramState.nodes with `parent`. */
export function TreeDiagram({ cells, diagramState = {} }: { cells: (number | string | null)[]; diagramState?: Record<string, unknown> }) {
  const states = asStates(diagramState.nodeStates);
  const custom = diagramState.nodes as { id: string; label: string | number; parent?: string }[] | undefined;

  if (custom?.length) {
    const kids = new Map<string | undefined, typeof custom>();
    custom.forEach((n) => kids.set(n.parent, [...(kids.get(n.parent) ?? []), n]));
    const nodes: GNode[] = [];
    let leaf = 0;
    const place = (n: (typeof custom)[number], depth: number): number => {
      const ch = kids.get(n.id) ?? [];
      const x = ch.length ? ch.map((c) => place(c, depth + 1)).reduce((a, b) => a + b) / ch.length : leaf++ * 64;
      nodes.push({ id: n.id, label: n.label, x, y: depth * 78 });
      return x;
    };
    (kids.get(undefined) ?? []).forEach((root) => place(root, 0));
    const edges = custom.filter((n) => n.parent).map((n) => [n.parent!, n.id] as [string, string]);
    return <Canvas nodes={nodes} edges={edges} states={states} r={20} />;
  }

  const depth = Math.max(1, Math.ceil(Math.log2(cells.length + 1)));
  const width = 2 ** (depth - 1) * 64;
  const nodes: GNode[] = [];
  const edges: [string, string][] = [];
  cells.forEach((v, i) => {
    if (v === null || v === undefined) return;
    const level = Math.floor(Math.log2(i + 1));
    const slots = 2 ** level;
    nodes.push({ id: String(i), label: v, x: ((i + 1 - slots + 0.5) / slots) * width, y: level * 80 });
    const parent = Math.floor((i - 1) / 2);
    if (i > 0 && cells[parent] != null) edges.push([String(parent), String(i)]);
  });
  return <Canvas nodes={nodes} edges={edges} states={states} />;
}

/** Graph from diagramState.nodes [{id,x,y}] and edges [[a,b]]. */
export function GraphDiagram({ diagramState = {} }: { diagramState?: Record<string, unknown> }) {
  const nodes = ((diagramState.nodes as (Omit<GNode, 'label'> & { label?: string })[]) ?? []).map((n) => ({ ...n, label: n.label ?? n.id }));
  return (
    <Canvas
      nodes={nodes}
      edges={(diagramState.edges as [string, string][]) ?? []}
      states={asStates(diagramState.nodeStates)}
      activeEdges={(diagramState.activeEdges as [string, string][]) ?? []}
      directed={Boolean(diagramState.directed)}
    />
  );
}

/** Hash table buckets: `buckets` (string|number)[][], `active` bucket index, `hit` entry prefix. */
export function HashMapDiagram({ diagramState = {} }: { diagramState?: Record<string, unknown> }) {
  const buckets = (diagramState.buckets as (string | number)[][]) ?? [];
  const active = diagramState.active as number | undefined;
  const hit = diagramState.hit as string | undefined;
  return (
    <div className="w-full max-w-[520px] space-y-1.5 font-dmmono text-sm">
      {buckets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-10 shrink-0 rounded-md border px-2 py-1.5 text-center text-xs transition-colors ${i === active ? 'border-[var(--accent-amber)] bg-[var(--surface-amber)] font-bold text-[var(--accent-amber)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
            {i}
          </span>
          <span className="text-[var(--text-muted)]">→</span>
          <div className="flex flex-wrap gap-1.5">
            {b.length === 0 && <span className="text-[var(--text-muted)]">∅</span>}
            {b.map((e) => (
              <motion.span
                key={String(e)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-md border px-2.5 py-1 ${hit !== undefined && String(e).startsWith(hit) ? 'border-[var(--accent-teal)] bg-[var(--surface-teal)] font-bold text-[var(--accent-teal)]' : 'border-[var(--border)] bg-[var(--white)] text-[var(--text-primary)]'}`}
              >
                {e}
              </motion.span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
