'use client';

import { useEffect, useState } from 'react';

import { usePrevious } from '@/hooks/usePrevious';

interface VariableStatePanelProps {
  variables: Record<string, string | number>
}

const SPECIAL_COLORS: Record<string, string> = {
  left: '#16A34A',
  right: '#EA580C',
  slow: '#1D7A6B',
  fast: '#D4603A',
};

export function VariableStatePanel({ variables }: VariableStatePanelProps) {
  const previous = usePrevious(variables);
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!previous) {
      return;
    }

    const changed = new Set<string>();
    for (const key of Object.keys(variables)) {
      if (variables[key] !== previous[key]) {
        changed.add(key);
      }
    }

    if (changed.size > 0) {
      setFlashing(changed);
      const timer = setTimeout(() => setFlashing(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [variables, previous]);

  const entries = Object.entries(variables);
  const columns = Math.min(entries.length, 4);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: '8px',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      {entries.map(([key, value]) => {
        const isFlashing = flashing.has(key);
        const specialColor = SPECIAL_COLORS[key];

        return (
          <div
            key={key}
            style={{
              background: isFlashing ? 'rgba(202,138,4,0.15)' : 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              transition: 'background 0.4s ease',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-dmmono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              {key}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-dmmono)',
                fontSize: 22,
                fontWeight: 600,
                color: specialColor || 'var(--text-primary)',
                transition: 'transform 0.1s',
                transform: isFlashing ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VariableStatePanel;
