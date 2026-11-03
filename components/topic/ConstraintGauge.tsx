'use client'
import { motion } from 'framer-motion'

interface ConstraintGaugeProps {
  currentValue: number
  maxValue: number
  label?: string
}

export function ConstraintGauge({ currentValue, maxValue, label = 'window size' }: ConstraintGaugeProps) {
  const ratio = maxValue > 0 ? currentValue / maxValue : 0
  const violated = currentValue > maxValue
  const fillColor = ratio <= 0.7 ? 'var(--role-found)' : ratio <= 0.9 ? 'var(--role-compare)' : 'var(--role-error)'
  const fillPct = Math.min(ratio, 1) * 100

  return (
    <div style={{
      background: violated ? 'color-mix(in srgb, var(--role-error) 4%, transparent)' : 'var(--bg-secondary)',
      border: `1px solid ${violated ? 'var(--role-error)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      transition: 'border-color 0.3s',
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: violated ? 'var(--role-error)' : 'var(--text-primary)' }}>
          {currentValue} / {maxValue}
        </span>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 20, borderRadius: 10, background: 'var(--rule)', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${fillPct}%`, backgroundColor: fillColor }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 10 }}
        />
        {/* Pulse overlay on violation */}
        {violated && (
          <motion.div
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 0.5, repeat: 3 }}
            style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, var(--role-error) 25%, transparent)', borderRadius: 10 }}
          />
        )}
      </div>

      {/* Violation message */}
      {violated && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--role-error)', marginTop: 8, letterSpacing: '0.05em' }}
        >
          CONSTRAINT VIOLATED → SHRINK LEFT
        </motion.p>
      )}
    </div>
  )
}
