'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { GLYPHS, strokeForSize } from '@/components/glyph';
import type { GlyphKey } from '@/components/glyph';
import { cn } from '@/components/ui';
import { PATTERN_GRAPH, matchesFilter, neighbourhood } from './graph';
import type { MapEdge, MapFilter, MapNode } from './graph';
import { NODE_R, computeLayout } from './layout';

const MIN_WIDTH = 680;
const MAX_WIDTH = 1180;
const HALF = 26;

/** Break a title into at most two short lines for the label under a tile. */
function wrapLabel(title: string): string[] {
  if (title.length <= 14) return [title];
  const words = title.split(' ');
  let best = [title];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

function GlyphMark({ id, size, color }: { id: GlyphKey; size: number; color: string }) {
  const def = GLYPHS[id] ?? GLYPHS.generic;
  const sw = strokeForSize(size);
  const scale = size / 24;
  const dash = `${sw * 0.9} ${sw * 1.7}`;
  return (
    <g
      transform={`translate(${-size / 2} ${-size / 2}) scale(${scale})`}
      style={{ stroke: color, fill: 'none', color }}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {def.dashed?.map((d, i) => <path key={`d${i}`} d={d} strokeDasharray={dash} opacity={0.7} />)}
      {def.paths.map((d, i) => <path key={i} d={d} />)}
      {def.dots?.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={Math.max(1.1, sw * 0.68)} style={{ fill: color, stroke: 'none' }} />
      ))}
    </g>
  );
}

function Tile({ group, grow = 0, style }: { group: MapNode['group']; grow?: number; style: React.CSSProperties }) {
  return group === 'data-structures' ? (
    <circle r={NODE_R + grow} style={style} />
  ) : (
    <rect x={-HALF - grow} y={-HALF - grow} width={(HALF + grow) * 2} height={(HALF + grow) * 2} rx={14 + grow} style={style} />
  );
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }, directed: boolean): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const startGap = NODE_R + 4;
  const endGap = NODE_R + (directed ? 9 : 4);
  const x1 = a.x + ux * startGap;
  const y1 = a.y + uy * startGap;
  const x2 = b.x - ux * endGap;
  const y2 = b.y - uy * endGap;
  // A slight bow, like a pen line, keeps parallel edges from stacking exactly.
  const bow = Math.min(18, len * 0.06);
  const cx = (x1 + x2) / 2 - uy * bow;
  const cy = (y1 + y2) / 2 + ux * bow;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function titleOf(id: string): string {
  return PATTERN_GRAPH.byId.get(id)?.title ?? id;
}

/**
 * The force-directed map. The layout is computed once per width (no running
 * simulation), then drawn as plain SVG: tiles with glyphs, arrows for "learn
 * first", dashed lines for "related".
 */
export default function MapCanvas({ filter }: { filter: MapFilter }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ringId, setRingId] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      // Ignore sub-pixel and tiny changes so a scrollbar appearing doesn't re-run the layout.
      setWidth((prev) => (Math.abs(prev - w) < 16 ? prev || w : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layoutWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
  const layout = useMemo(() => (width > 0 ? computeLayout(layoutWidth) : null), [width, layoutWidth]);
  const hood = useMemo(() => (activeId ? neighbourhood(activeId) : null), [activeId]);
  const active = activeId ? PATTERN_GRAPH.byId.get(activeId) : undefined;

  const nodeVisible = (n: MapNode) => matchesFilter(n, filter);

  return (
    <div>
      <div
        ref={wrapRef}
        className="overflow-x-auto rounded-card border border-rule bg-paper-raised"
        style={{ minHeight: 320 }}
      >
        {layout ? (
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="group"
            aria-label="Pattern map: lessons as tiles, arrows pointing from what to learn first"
            className="block"
            onMouseLeave={() => setActiveId(null)}
          >
            <defs>
              <marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M1 1.5L9 5L1 8.5" style={{ fill: 'none', stroke: 'var(--ink-3)' }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <marker id="pm-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M1 1.5L9 5L1 8.5" style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            <g aria-hidden="true" fill="none">
              {PATTERN_GRAPH.edges.map((edge: MapEdge) => {
                const a = layout.positions.get(edge.source);
                const b = layout.positions.get(edge.target);
                if (!a || !b) return null;
                const s = PATTERN_GRAPH.byId.get(edge.source);
                const t = PATTERN_GRAPH.byId.get(edge.target);
                const inFilter = !!s && !!t && nodeVisible(s) && nodeVisible(t);
                const isActive = activeId !== null && (edge.source === activeId || edge.target === activeId);
                const directed = edge.kind === 'prereq';
                const opacity = !inFilter ? 0.1 : activeId && !isActive ? 0.12 : 1;
                return (
                  <path
                    key={edge.id}
                    d={edgePath(a, b, directed)}
                    className="motion-safe:transition-opacity motion-safe:duration-150"
                    strokeLinecap="round"
                    markerEnd={directed ? `url(#${isActive ? 'pm-arrow-active' : 'pm-arrow'})` : undefined}
                    strokeDasharray={directed ? undefined : '3 5'}
                    strokeWidth={directed ? (isActive ? 2 : 1.5) : isActive ? 1.75 : 1.25}
                    style={{ stroke: isActive ? 'var(--ink)' : 'var(--rule-strong)', opacity }}
                  />
                );
              })}
            </g>

            <g>
              {PATTERN_GRAPH.nodes.map((node) => {
                const pos = layout.positions.get(node.id);
                if (!pos) return null;
                const visible = nodeVisible(node);
                const dimmed = hood !== null && !hood.has(node.id);
                const live = node.status === 'live';
                const tint = node.group === 'data-structures' ? 'var(--role-ptr-a-wash)' : 'var(--coral-wash)';
                const glyphColor = node.group === 'data-structures' ? 'var(--teal)' : 'var(--coral-ink)';
                const lines = wrapLabel(node.title);
                const label =
                  `${node.title}, ${node.groupTitle}, ${live ? 'live lesson' : 'draft'}.` +
                  (node.prereqs.length ? ` Learn first: ${node.prereqs.map(titleOf).join(', ')}.` : ' No prerequisites.');
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`}
                    style={{ opacity: !visible ? 0.18 : dimmed ? 0.28 : 1, pointerEvents: visible ? 'auto' : 'none' }}
                    className="motion-safe:transition-opacity motion-safe:duration-150"
                    onMouseEnter={() => visible && setActiveId(node.id)}
                  >
                    <Link
                      href={`/learn/${node.id}`}
                      aria-label={label}
                      tabIndex={visible ? 0 : -1}
                      style={{ outline: 'none', cursor: 'pointer' }}
                      onFocus={(e) => {
                        setActiveId(node.id);
                        if (e.currentTarget.matches(':focus-visible')) setRingId(node.id);
                      }}
                      onBlur={() => {
                        setActiveId((cur) => (cur === node.id ? null : cur));
                        setRingId((cur) => (cur === node.id ? null : cur));
                      }}
                    >
                      {ringId === node.id ? (
                        <Tile group={node.group} grow={6} style={{ fill: 'none', stroke: 'var(--focus-ring)', strokeWidth: 2.5 }} />
                      ) : null}
                      {/* Opaque underlay so edges never show through the wash. */}
                      <Tile group={node.group} style={{ fill: 'var(--paper-raised)', stroke: 'none' }} />
                      <Tile
                        group={node.group}
                        style={{
                          fill: tint,
                          stroke: live ? 'var(--ink)' : 'var(--ink-2)',
                          strokeWidth: live ? 2.25 : 1.5,
                          strokeDasharray: live ? 'none' : '4 3',
                        }}
                      />
                      <GlyphMark id={node.glyph} size={30} color={glyphColor} />
                      <text
                        textAnchor="middle"
                        style={{
                          fill: 'var(--ink)',
                          stroke: 'var(--paper-raised)',
                          strokeWidth: 4,
                          paintOrder: 'stroke',
                          strokeLinejoin: 'round',
                          fontFamily: 'var(--font-sans), system-ui, sans-serif',
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {lines.map((line, i) => (
                          // The trailing space on all but the last line keeps the link's text ("Binary Search Trees")
                          // equal to its aria-label prefix; without it the lines would concatenate as "SearchTrees".
                          <tspan key={line} x={0} y={NODE_R + 17 + i * 14}>
                            {i < lines.length - 1 ? `${line} ` : line}
                          </tspan>
                        ))}
                      </text>
                    </Link>
                  </g>
                );
              })}
            </g>
          </svg>
        ) : null}
      </div>

      <div className={cn('t-small mt-3 min-h-[44px] text-ink-2')}>
        {active ? (
          <p>
            <span className="font-semibold text-ink">{active.title}</span>
            <span aria-hidden="true"> · </span>
            {active.oneLiner}
            {active.prereqs.length > 0 ? <span className="text-ink-3"> Learn first: {active.prereqs.map(titleOf).join(', ')}.</span> : null}
            {active.related.length > 0 ? <span className="text-ink-3"> Related: {active.related.map(titleOf).join(', ')}.</span> : null}
          </p>
        ) : (
          <p className="text-ink-3">Hover or focus a tile to trace its connections. Click to open the lesson.</p>
        )}
      </div>
    </div>
  );
}
