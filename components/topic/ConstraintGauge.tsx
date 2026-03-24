import React from 'react';

interface ConstraintGaugeProps {
  value: number;
  max: number;
  label?: string;
}

export default function ConstraintGauge({ value, max, label = "Constraint" }: ConstraintGaugeProps) {
  // Calculate percentage (clamped 0-100)
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Color logic
  let color = '#16A34A'; // Green (Safe)
  if (pct > 75) color = '#CA8A04'; // Amber (Warning)
  if (pct >= 100) color = '#DC2626'; // Red (Violation)

  // SVG Gauge metrics
  const radius = 40;
  const dashArray = Math.PI * radius; // Half circle
  const dashOffset = dashArray - (dashArray * pct) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-14 overflow-hidden">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E5E0D8"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Fill Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
           <span className="font-dmmono font-bold text-lg" style={{ color }}>{value}</span>
           <span className="font-dmmono text-xs text-[var(--text-muted)]">/{max}</span>
        </div>
      </div>
      <span className="font-dmsans text-xs font-medium text-[var(--text-secondary)] mt-1">{label}</span>
    </div>
  );
}
