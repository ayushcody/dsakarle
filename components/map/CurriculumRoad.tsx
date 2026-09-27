'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView } from 'framer-motion';

import { getBadgeForSlug } from '@/components/badges/registry';
import { getProgress } from '@/lib/progress';

export type RoadTopic = {
  slug: string
  title: string
  group: string
  difficulty: string
  minutes: number
  summary: string
}

const W = 1000;
const STEP = 190;
const TOP = 170;
const BRIDGE_GAP = 260;
const EASE = [0.4, 0, 0.2, 1] as const;

const ZONES: Record<string, { name: string; tint: string; ink: string }> = {
  'Data Structures': { name: 'Data Structures Village', tint: 'rgba(92, 128, 72, 0.10)', ink: '#5C7F48' },
  Algorithms: { name: 'Algorithms Mountain Range', tint: 'rgba(88, 92, 168, 0.10)', ink: '#5A5CA8' },
};

const DIFF: Record<string, string> = {
  beginner: 'text-[var(--accent-teal)] bg-[var(--surface-teal)]',
  intermediate: 'text-[var(--accent-amber)] bg-[var(--surface-amber)]',
  medium: 'text-[var(--accent-amber)] bg-[var(--surface-amber)]',
  hard: 'text-[var(--accent-coral)] bg-[var(--surface-coral)]',
};

// Art-directed serpentine: x swings follow a fixed rhythm, not randomness.
const SWING = [0.24, 0.5, 0.74, 0.6, 0.3, 0.46, 0.72, 0.5];

function layout(topics: RoadTopic[]) {
  let y = TOP;
  let bridgeY = 0;
  const pts = topics.map((t, i) => {
    if (i > 0 && t.group !== topics[i - 1].group) {
      bridgeY = y + (BRIDGE_GAP - STEP) / 2 + STEP / 2;
      y += BRIDGE_GAP;
    } else if (i > 0) y += STEP;
    return { x: SWING[i % SWING.length] * W, y };
  });
  return { pts, bridgeY, height: y + TOP };
}

function smoothPath(p: { x: number; y: number }[]) {
  let d = `M ${p[0].x} ${p[0].y - 120}  C ${p[0].x} ${p[0].y - 60}, ${p[0].x} ${p[0].y - 40}, ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const my = (b.y - a.y) * 0.55;
    d += ` C ${a.x} ${a.y + my}, ${b.x} ${b.y - my}, ${b.x} ${b.y}`;
  }
  return d;
}

function Node({ topic, x, y, height, done, current }: { topic: RoadTopic; x: number; y: number; height: number; done: boolean; current: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [open, setOpen] = useState(false);
  const Icon = getBadgeForSlug(topic.slug);
  const right = x > W * 0.55;

  return (
    <div
      ref={ref}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${(x / W) * 100}%`, top: `${(y / height) * 100}%`, zIndex: open ? 30 : 10 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Link
          href={`/learn/${topic.slug}`}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          aria-label={`${topic.title}${done ? ' (completed)' : ''}`}
          className="group relative flex flex-col items-center outline-none"
        >
          <span
            className={`relative flex h-[76px] w-[76px] sm:h-[92px] sm:w-[92px] items-center justify-center rounded-full bg-[var(--white)] shadow-[0_10px_24px_-8px_rgba(90,60,30,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-focus-visible:ring-4 group-focus-visible:ring-[var(--accent-coral)]/40 ${current ? 'road-float' : ''}`}
            style={done ? { filter: 'drop-shadow(0 0 12px rgba(217, 155, 38, 0.8))' } : undefined}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={done ? 'var(--accent-amber)' : 'transparent'} strokeWidth="5" strokeLinecap="round" />
            </svg>
            <Icon width={46} height={46} className="text-[var(--accent-coral)]" />
            {done && (
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-amber)] text-white shadow-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
              </span>
            )}
          </span>
          <span className="mt-2 max-w-[120px] sm:max-w-[160px] rounded-full bg-[var(--bg-secondary)]/90 px-3 py-1 text-center font-dmsans text-[12px] sm:text-[13px] font-bold leading-tight text-[var(--text-primary)] shadow-sm">
            {topic.title}
          </span>
        </Link>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: right ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`pointer-events-auto absolute top-1/2 hidden w-[260px] -translate-y-1/2 rounded-[16px] border border-[var(--border)] bg-[var(--white)] p-5 shadow-[var(--shadow-card-hover)] sm:block ${right ? 'right-[calc(100%+12px)] origin-right' : 'left-[calc(100%+12px)] origin-left'}`}
          >
            <p className="font-dmsans text-lg font-bold text-[var(--text-primary)]">{topic.title}</p>
            <div className="mt-2 flex gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${DIFF[topic.difficulty] ?? DIFF.medium}`}>{topic.difficulty}</span>
              <span className="rounded-md bg-[var(--bg-primary)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] tabular-nums">{topic.minutes} min</span>
            </div>
            <p className="mt-3 line-clamp-3 font-dmsans text-sm leading-relaxed text-[var(--text-secondary)]">{topic.summary}</p>
            <Link href={`/learn/${topic.slug}`} className="mt-4 inline-flex rounded-full bg-[var(--accent-coral)] px-4 py-2 font-dmsans text-sm font-bold text-white transition-colors hover:bg-[var(--accent-coral-dark)]">
              {done ? 'Review' : 'Study'} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CurriculumRoad({ topics }: { topics: RoadTopic[] }) {
  const { pts, bridgeY, height } = useMemo(() => layout(topics), [topics]);
  const d = useMemo(() => smoothPath(pts), [pts]);
  const pathRef = useRef<SVGPathElement>(null);
  const [done, setDone] = useState<string[]>([]);
  const [last, setLast] = useState('');
  const [car, setCar] = useState<{ x: number; y: number; a: number } | null>(null);

  useEffect(() => {
    const p = getProgress();
    setDone(p.completedSections);
    setLast(p.lastVisited);
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const idx = Math.max(0, topics.findIndex((t) => t.slug === last));
    const target = pts[idx];
    // Find the path length closest to the target node.
    const total = path.getTotalLength();
    let best = 0;
    let bestDist = Infinity;
    for (let l = 0; l <= total; l += 8) {
      const q = path.getPointAtLength(l);
      const dist = (q.x - target.x) ** 2 + (q.y - target.y) ** 2;
      if (dist < bestDist) { bestDist = dist; best = l; }
    }
    const place = (l: number) => {
      const a = path.getPointAtLength(l);
      const b = path.getPointAtLength(Math.min(total, l + 2));
      setCar({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      place(best);
      return;
    }
    const controls = animate(0, best, { duration: Math.min(4, 1 + best / 1500), ease: [0.16, 1, 0.3, 1], onUpdate: place });
    return () => controls.stop();
  }, [last, pts, topics]);

  const split = topics.findIndex((t, i) => i > 0 && t.group !== topics[i - 1].group);
  const zoneBands = [
    { key: topics[0]?.group, y0: 0, y1: bridgeY - 40 },
    { key: topics[split]?.group, y0: bridgeY + 40, y1: height },
  ];
  const doneCount = topics.filter((t) => done.includes(t.slug)).length;

  return (
    <div className="relative mx-auto w-full max-w-[1100px] px-4">
      <div className="road-paper relative overflow-hidden rounded-[28px] border border-[var(--border)]" style={{ aspectRatio: `${W} / ${height}` }}>
        <svg viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <filter id="road-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#7A5A3A" floodOpacity="0.18" />
            </filter>
          </defs>

          {zoneBands.map((z) => z.key && (
            <g key={z.key}>
              <rect x="0" y={z.y0} width={W} height={z.y1 - z.y0} fill={ZONES[z.key]?.tint} />
              <text x={W - 40} y={z.y0 + 64} textAnchor="end" className="font-dmsans" fontSize="30" fontWeight="800" fill={ZONES[z.key]?.ink} opacity="0.85">{ZONES[z.key]?.name}</text>
            </g>
          ))}

          {/* Scenery: rooftops in the village, peaks in the mountains */}
          {[[860, 260], [120, 700], [880, 1180], [140, 1560], [860, 2000]].map(([x, y], i) => y < bridgeY - 60 && (
            <path key={`h${i}`} d={`M ${x - 34} ${y} L ${x} ${y - 30} L ${x + 34} ${y} Z M ${x - 26} ${y} h 52 v 34 h -52 Z`} fill="#8A6A48" opacity="0.18" />
          ))}
          {[[880, bridgeY + 360], [110, bridgeY + 760], [890, bridgeY + 1180], [120, bridgeY + 1620]].map(([x, y], i) => y < height - 80 && (
            <path key={`m${i}`} d={`M ${x - 70} ${y} L ${x - 20} ${y - 90} L ${x + 10} ${y - 50} L ${x + 36} ${y - 110} L ${x + 80} ${y} Z`} fill="#5A5CA8" opacity="0.14" />
          ))}

          <path d={d} fill="none" stroke="#BCA98F" strokeWidth="44" strokeLinecap="round" filter="url(#road-shadow)" />
          <path ref={pathRef} d={d} fill="none" stroke="#D4C5B5" strokeWidth="32" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#FFFDF9" strokeWidth="3" strokeDasharray="20 16" strokeLinecap="round" opacity="0.9" />

          {/* Bridge between the zones */}
          <g transform={`translate(${W / 2} ${bridgeY})`}>
            <rect x="-230" y="-26" width="460" height="52" rx="26" fill="var(--bg-secondary)" stroke="var(--border-strong)" strokeWidth="2" />
            <text textAnchor="middle" y="8" fontSize="20" fontWeight="800" fill="var(--accent-amber)" className="font-dmsans">
              🏆 Foundation Complete{doneCount ? ` · ${doneCount}/${topics.length}` : ''}
            </text>
          </g>

          {car && (
            <g transform={`translate(${car.x} ${car.y}) rotate(${car.a})`}>
              <rect x="-20" y="-12" width="40" height="24" rx="8" fill="var(--accent-coral)" />
              <rect x="0" y="-9" width="12" height="18" rx="3" fill="#FFFDF9" opacity="0.85" />
              <circle cx="-11" cy="-13" r="4" fill="#1D1D1F" />
              <circle cx="11" cy="-13" r="4" fill="#1D1D1F" />
              <circle cx="-11" cy="13" r="4" fill="#1D1D1F" />
              <circle cx="11" cy="13" r="4" fill="#1D1D1F" />
            </g>
          )}
        </svg>

        {topics.map((t, i) => (
          <Node key={t.slug} topic={t} x={pts[i].x} y={pts[i].y} height={height} done={done.includes(t.slug)} current={t.slug === last} />
        ))}
      </div>
    </div>
  );
}

export default CurriculumRoad;
