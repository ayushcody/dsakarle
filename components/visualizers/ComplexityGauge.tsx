'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { axisBottom, axisLeft, curveBasis, format, scaleLinear, scaleLog, select, line as d3line } from 'd3';

type ComplexityName = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)';

interface ComplexityGaugeProps {
  highlight: ComplexityName[];
  title?: string;
}

const COMPLEXITIES: { name: ComplexityName; color: string; fn: (n: number) => number }[] = [
  { name: 'O(1)', color: '#5DCAA5', fn: () => 1 },
  { name: 'O(log n)', color: '#69B8F7', fn: (n) => Math.log2(Math.max(n, 1)) },
  { name: 'O(n)', color: '#FAC775', fn: (n) => n },
  { name: 'O(n log n)', color: '#F0997B', fn: (n) => n * Math.log2(Math.max(n, 1)) },
  { name: 'O(n²)', color: '#F09595', fn: (n) => n * n },
  { name: 'O(2ⁿ)', color: '#8B0000', fn: (n) => Math.min(Math.pow(2, n), 1e15) },
];

const REAL_WORLD: Record<number, string> = {
  3: '~your phone\'s contacts list',
  5: '~a city\'s search index',
  7: '~Instagram users in Maharashtra',
};

function formatOps(n: number): string {
  if (!isFinite(n) || n > 1e15) return '∞';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

export function ComplexityGauge({ highlight, title }: ComplexityGaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [logN, setLogN] = useState(3); // 10^3 = 1000
  const n = Math.round(Math.pow(10, logN));

  const ops = useMemo(() => {
    const result: Record<string, number> = {};
    for (const c of COMPLEXITIES) {
      result[c.name] = c.fn(n);
    }
    return result;
  }, [n]);

  const drawChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 600;
    const H = 280;
    const MARGIN = { top: 20, right: 80, bottom: 40, left: 60 };
    const w = W - MARGIN.left - MARGIN.right;
    const h = H - MARGIN.top - MARGIN.bottom;

    svg.attr('viewBox', `0 0 ${W} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Scales
    const xScale = scaleLinear().domain([1, n]).range([0, w]);
    const yScale = scaleLog().domain([1, Math.max(ops['O(n²)'] || 1, 10)]).range([h, 0]).clamp(true);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(axisBottom(xScale).ticks(5).tickFormat((d) => format('.0s')(d as number)))
      .selectAll('text')
      .style('fill', 'var(--ink-3)')
      .style('font-size', '10px')
      .style('font-family', 'var(--font-mono)');

    g.append('g')
      .call(axisLeft(yScale).ticks(4, '.0s'))
      .selectAll('text')
      .style('fill', 'var(--ink-3)')
      .style('font-size', '10px')
      .style('font-family', 'var(--font-mono)');

    // Axis labels
    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + 35)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--ink-3)')
      .style('font-size', '11px')
      .style('font-family', 'var(--font-mono)')
      .text('input size (n)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--ink-3)')
      .style('font-size', '11px')
      .style('font-family', 'var(--font-mono)')
      .text('operations');

    // Draw complexity curves
    const numPoints = 100;
    for (const c of COMPLEXITIES) {
      // Skip O(2^n) for large n
      if (c.name === 'O(2ⁿ)' && n > 30) continue;

      const isHighlighted = highlight.includes(c.name);
      const points: [number, number][] = [];

      for (let i = 0; i <= numPoints; i++) {
        const x = 1 + (i / numPoints) * (n - 1);
        const y = c.fn(x);
        if (y > 0 && isFinite(y)) {
          points.push([x, Math.max(1, y)]);
        }
      }

      const line = d3line<[number, number]>()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .curve(curveBasis);

      g.append('path')
        .datum(points)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', c.color)
        .attr('stroke-width', isHighlighted ? 3 : 1.5)
        .attr('opacity', isHighlighted ? 1 : 0.2)
        .attr('stroke-linecap', 'round');

      // End label
      if (isHighlighted && points.length > 0) {
        const last = points[points.length - 1];
        g.append('text')
          .attr('x', xScale(last[0]) + 6)
          .attr('y', yScale(last[1]) + 4)
          .text(c.name)
          .style('fill', c.color)
          .style('font-size', '11px')
          .style('font-weight', '600')
          .style('font-family', 'var(--font-mono)');
      }
    }

    // Grid lines
    g.selectAll('.domain').style('stroke', 'var(--rule)');
    g.selectAll('.tick line').style('stroke', 'var(--rule)');
  }, [n, highlight, ops]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const realWorldLabel = REAL_WORLD[logN];

  return (
    <section
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--paper-raised)',
        boxShadow: 'var(--shadow-card)',
        padding: '32px',
        marginTop: 40,
      }}
    >
      <h2 className="topic-h2" style={{ marginTop: 0 }}>
        📏 {title || 'Complexity Gauge'}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-dmsans)',
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 20,
        }}
      >
        Drag the slider to see how operations grow. Feel the difference.
      </p>

      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <label
          style={{
            fontFamily: 'var(--font-dmmono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            minWidth: 30,
          }}
        >
          n =
        </label>
        <input
          type="range"
          min={1}
          max={7}
          step={0.1}
          value={logN}
          onChange={(e) => setLogN(parseFloat(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--accent-coral)',
            height: 6,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-dmmono)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            minWidth: 120,
            textAlign: 'right',
          }}
        >
          {n.toLocaleString()}
        </span>
      </div>

      {/* Real-world annotation */}
      {realWorldLabel && (
        <div
          style={{
            fontFamily: 'var(--font-dmsans)',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {realWorldLabel}
        </div>
      )}

      {/* D3 Chart */}
      <svg ref={svgRef} style={{ width: '100%', maxWidth: 600 }} />

      {/* Operation count cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 8,
          marginTop: 20,
        }}
      >
        {COMPLEXITIES.map((c) => {
          const isHL = highlight.includes(c.name);
          const value = ops[c.name];

          return (
            <div
              key={c.name}
              style={{
                padding: '12px 10px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isHL ? c.color : 'var(--border)'}`,
                background: isHL ? `${c.color}10` : 'var(--bg-secondary)',
                textAlign: 'center',
                opacity: isHL ? 1 : 0.4,
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-dmmono)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isHL ? c.color : 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-dmmono)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: isHL ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {formatOps(value)} ops
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ComplexityGauge;
