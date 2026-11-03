'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/components/ui'
import type { Val, VarSpec } from '@/lib/engine/types'
import { flash } from '@/lib/motion'
import { VAR_VISUAL } from '@/lib/stage/semantics'

import { useStage } from './StageProvider'

const HISTORY = 24

function show(v: Val | undefined): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return `[${v.map((x) => show(x as Val)).join(', ')}]`
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

/** Tiny history line, scaled to its own range. The last point is a dot. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="w-[64px]" aria-hidden="true" />
  const W = 64
  const H = 18
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (W - pad * 2),
    max === min ? H / 2 : pad + (1 - (v - min) / span) * (H - pad * 2),
  ])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className="shrink-0">
      <path d={d} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} style={{ stroke: color }} />
      <circle cx={lx} cy={ly} r={2.4} style={{ fill: color }} />
    </svg>
  )
}

function VarRow({ spec, value, history }: { spec: VarSpec; value: Val | undefined; history: number[] }) {
  const vis = VAR_VISUAL[spec.role]
  const shown = show(value)
  const prev = useRef(shown)
  const [flashKey, setFlashKey] = useState(0)

  // Highlighter flash whenever the shown value changes (forwards or backwards).
  useEffect(() => {
    if (prev.current !== shown) {
      prev.current = shown
      setFlashKey((k) => k + 1)
    }
  }, [shown])

  const glyph = vis.cue.glyph
  return (
    <div className="flex items-center gap-3 py-2">
      <dt className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[14px] text-ink-2">
        <span
          aria-hidden="true"
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-cell text-[11px] font-bold leading-none"
          style={{ color: vis.stroke, background: spec.role === 'value' ? 'transparent' : spec.role === 'best' ? `color-mix(in srgb, ${vis.stroke} 20%, transparent)` : vis.wash, border: spec.role === 'value' ? '1px solid var(--rule-strong)' : undefined }}
        >
          {glyph ?? ''}
        </span>
        <span className="truncate">{spec.label ?? spec.name}</span>
      </dt>
      <Sparkline values={history} color={vis.stroke} />
      <dd className="relative m-0 min-w-[3.5rem] text-right font-mono text-[18px] font-semibold leading-7" style={{ color: vis.text }}>
        {flashKey > 0 ? (
          <motion.span
            key={flashKey}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1.5 inset-y-0.5 rounded-cell"
            style={{ background: 'var(--role-changed)' }}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={flash}
          />
        ) : null}
        <span className="relative">{shown}</span>
      </dd>
    </div>
  )
}

export interface VarsPanelProps {
  vars: VarSpec[]
  className?: string
}

/** "What the program remembers right now": one row per variable, with a flash on change and a tiny history. */
export function VarsPanel({ vars, className }: VarsPanelProps) {
  const frames = useStage((s) => s.frames)
  const index = useStage((s) => s.index)
  const current = frames[index]?.vars

  const histories = useMemo(() => {
    const from = Math.max(0, index - HISTORY + 1)
    const out: Record<string, number[]> = {}
    for (const spec of vars) {
      const h: number[] = []
      for (let i = from; i <= index; i++) {
        const v = frames[i]?.vars[spec.name]
        if (typeof v === 'number' && Number.isFinite(v)) h.push(v)
      }
      out[spec.name] = h
    }
    return out
  }, [frames, index, vars])

  if (vars.length === 0) return null
  return (
    <section className={className} aria-label="Variables">
      <h3 className="t-eyebrow mb-1">What it remembers</h3>
      <dl className={cn('m-0 divide-y divide-rule rounded-card border border-rule bg-paper-raised px-3')}>
        {vars.map((spec) => (
          <VarRow key={spec.name} spec={spec} value={current?.[spec.name]} history={histories[spec.name] ?? []} />
        ))}
      </dl>
    </section>
  )
}
