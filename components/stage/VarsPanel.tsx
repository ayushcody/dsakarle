'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import type { Val, VarSpec } from '@/lib/engine/types'
import { flash } from '@/lib/motion'
import { VAR_VISUAL } from '@/lib/stage/semantics'

import { useStage } from './StageProvider'

function show(v: Val | undefined): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return `[${v.map((x) => show(x as Val)).join(', ')}]`
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

function VarRow({ spec, value }: { spec: VarSpec; value: Val | undefined }) {
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
    <div className="flex h-9 min-w-0 items-center justify-between gap-2">
      <dt className="flex min-w-0 shrink-0 items-baseline gap-1.5 font-mono text-[13px] text-ink-3">
        {glyph ? (
          <span aria-hidden="true" className="shrink-0 text-[11px] font-bold" style={{ color: vis.stroke }}>
            {glyph}
          </span>
        ) : null}
        <span className="truncate">{spec.label ?? spec.name}</span>
      </dt>
      <dd className="relative m-0 min-w-0 truncate text-right font-mono text-[15px] font-medium leading-6"
        title={shown} style={{ color: vis.text }}>
        {flashKey > 0 ? (
          <motion.span
            key={flashKey}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1 inset-y-0.5 rounded-cell"
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

/** "What the program remembers right now": a compact two-column grid, name and value in mono, with a flash on change. */
export function VarsPanel({ vars, className }: VarsPanelProps) {
  const frames = useStage((s) => s.frames)
  const index = useStage((s) => s.index)
  const current = frames[index]?.vars

  if (vars.length === 0) return null
  return (
    <section className={className} aria-label="Variables">
      <h3 className="t-eyebrow mb-1">What it remembers</h3>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-x-6 border-t border-rule">
        {vars.map((spec) => (
          <VarRow key={spec.name} spec={spec} value={current?.[spec.name]} />
        ))}
      </dl>
    </section>
  )
}
