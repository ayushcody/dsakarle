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
  const fillColor = ratio <= 0.7 ? '#16A34A' : ratio <= 0.9 ? '#CA8A04' : '#DC2626'
  const fillPct = Math.min(ratio, 1) * 100

  return (
    <div style={{
      background: violated ? 'rgba(220,38,38,0.04)' : 'var(--bg-secondary)',
      border: `1px solid ${violated ? '#DC2626' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      transition: 'border-color 0.3s',
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, color: violated ? '#DC2626' : 'var(--text-primary)' }}>
          {currentValue} / {maxValue}
        </span>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 20, borderRadius: 10, background: '#E5E0D8', overflow: 'hidden' }}>
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
            style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.25)', borderRadius: 10 }}
          />
        )}
      </div>

      {/* Violation message */}
      {violated && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600, color: '#DC2626', marginTop: 8, letterSpacing: '0.05em' }}
        >
          CONSTRAINT VIOLATED → SHRINK LEFT
        </motion.p>
      )}
    </div>
  )
}
