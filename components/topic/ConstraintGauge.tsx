'use client';

import { motion } from 'framer-motion';

interface ConstraintGaugeProps {
  currentValue: number
  maxValue: number
  label?: string
}

export function ConstraintGauge({ currentValue, maxValue, label = 'constraint' }: ConstraintGaugeProps) {
  const ratio = Math.min(currentValue / maxValue, 1.1);
  const violated = currentValue > maxValue;
  const fillColor = ratio < 0.7 ? '#16A34A' : ratio < 0.9 ? '#CA8A04' : '#DC2626';
  const fillWidth = Math.min(ratio, 1) * 280;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${violated ? '#DC2626' : 'var(--border)'}`,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-dmmono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {label}: {currentValue} / {maxValue}
      </div>
      <svg width={300} height={24}>
        <rect x={0} y={0} width={300} height={24} rx={12} fill="#E5E0D8" />
        <motion.rect
          x={0}
          y={0}
          height={24}
          rx={12}
          animate={{ width: fillWidth, fill: fillColor }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        {violated && (
          <motion.rect
            x={0}
            y={0}
            width={300}
            height={24}
            rx={12}
            fill="transparent"
            stroke="#DC2626"
            strokeWidth={2}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.4, repeat: 2 }}
          />
        )}
      </svg>
      {violated && (
        <div
          style={{
            fontFamily: 'var(--font-dmmono)',
            fontSize: 11,
            color: '#DC2626',
            marginTop: 6,
          }}
        >
          CONSTRAINT VIOLATED → SHRINK LEFT
        </div>
      )}
    </div>
  );
}

export default ConstraintGauge;
