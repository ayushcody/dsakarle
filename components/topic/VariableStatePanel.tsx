'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { usePrevious } from '@/hooks/usePrevious';

interface VariableTracePanelProps {
  /** All variable snapshots from step 0 to the last step */
  stepHistory: Array<Record<string, string | number>>;
  /** Currently active step index */
  currentStep: number;
  /** How many past steps to render in sparklines (default 8) */
  maxHistory?: number;
}

interface VariableEntry {
  name: string;
  currentValue: string | number;
  history: (string | number)[];
  changed: boolean;
  type: 'pointer' | 'boolean' | 'value';
}

const POINTER_NAMES = new Set(['left', 'right', 'i', 'j', 'slow', 'fast', 'start', 'end', 'lo', 'hi', 'mid']);
const SPECIAL_COLORS: Record<string, string> = {
  left: 'var(--role-ptr-a)',
  right: 'var(--role-ptr-b)',
  slow: 'var(--role-ptr-a)',
  fast: 'var(--role-ptr-b)',
};

/** Tiny inline sparkline SVG for numeric history */
function Sparkline({ values }: { values: number[] }) {
  const W = 72;
  const H = 18;
  const PAD = 2;

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x.toFixed(1)},${H} L${points[0].x.toFixed(1)},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      <path d={areaD} style={{ fill: 'var(--role-ptr-a-wash)' }} />
      <path d={pathD} fill="none" stroke="var(--accent-teal)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current value dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill="var(--accent-teal)" />
    </svg>
  );
}

/** Boolean badge */
function BoolBadge({ value }: { value: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        fontSize: 12,
        fontWeight: 700,
        background: value ? 'var(--surface-success)' : 'var(--surface-danger)',
        color: value ? 'var(--state-success)' : 'var(--state-danger)',
      }}
    >
      {value ? '✓' : '✗'}
    </span>
  );
}

function detectType(name: string, value: string | number): VariableEntry['type'] {
  if (typeof value === 'boolean' || value === 'true' || value === 'false') return 'boolean';
  if (POINTER_NAMES.has(name.toLowerCase())) return 'pointer';
  return 'value';
}

export function VariableStatePanel({ stepHistory, currentStep, maxHistory = 8 }: VariableTracePanelProps) {
  const previousStep = usePrevious(currentStep);
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  const currentVars = stepHistory[currentStep];
  const previousVars = currentStep > 0 ? stepHistory[currentStep - 1] : undefined;

  // Build variable entries with history
  const entries: VariableEntry[] = useMemo(() => {
    const activeVars = currentVars ?? {};
    const names = Object.keys(activeVars);
    const histStart = Math.max(0, currentStep - maxHistory + 1);

    return names.map((name) => {
      const history: (string | number)[] = [];
      for (let s = histStart; s <= currentStep; s++) {
        history.push(stepHistory[s]?.[name] ?? 0);
      }

      const changed = previousVars ? activeVars[name] !== previousVars[name] : false;
      const type = detectType(name, activeVars[name]);

      return { name, currentValue: activeVars[name], history, changed, type };
    });
  }, [stepHistory, currentStep, maxHistory, currentVars, previousVars]);

  // Ghost row: values from 3 steps ago
  const ghostVars = currentStep >= 3 ? stepHistory[currentStep - 3] : null;

  // Flash changed variables amber
  useEffect(() => {
    if (previousStep === undefined || previousStep === currentStep) return;

    const changed = new Set<string>();
    for (const e of entries) {
      if (e.changed) changed.add(e.name);
    }

    if (changed.size > 0) {
      setFlashing(changed);
      const timer = setTimeout(() => setFlashing(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [currentStep, previousStep, entries]);

  const columns = Math.min(entries.length, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Live indicator header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          fontFamily: 'var(--font-dmmono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--state-success)',
            display: 'inline-block',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        Variables
      </div>

      {/* Main variable grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: '8px',
          padding: '0 16px 16px',
        }}
      >
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => {
            const isFlashing = flashing.has(entry.name);
            const specialColor = SPECIAL_COLORS[entry.name];
            const numericHistory = entry.history.filter((v): v is number => typeof v === 'number');
            const isBool = entry.type === 'boolean';
            const boolValue = String(entry.currentValue) === 'true';

            return (
              <motion.div
                key={entry.name}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: isFlashing ? 'color-mix(in srgb, var(--amber) 15%, transparent)' : 'var(--paper-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  transition: 'background 0.3s ease',
                }}
              >
                {/* Variable name */}
                <div
                  style={{
                    fontFamily: 'var(--font-dmmono)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  {entry.name}
                </div>

                {/* Value + sparkline row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {/* Value */}
                  {isBool ? (
                    <BoolBadge value={boolValue} />
                  ) : (
                    <motion.div
                      style={{
                        fontFamily: 'var(--font-dmmono)',
                        fontSize: 22,
                        fontWeight: 600,
                        color: specialColor || 'var(--text-primary)',
                      }}
                      animate={{ scale: isFlashing ? 1.08 : 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {entry.currentValue}
                    </motion.div>
                  )}

                  {/* Sparkline (only for numeric history with 2+ points) */}
                  {!isBool && numericHistory.length >= 2 && (
                    <Sparkline values={numericHistory} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Ghost row: 3 steps ago */}
      {ghostVars && (
        <div
          style={{
            padding: '0 16px 12px',
            opacity: 0.3,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-dmmono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            3 steps ago:
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(ghostVars).map(([key, val]) => (
              <span
                key={key}
                style={{
                  fontFamily: 'var(--font-dmmono)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {key}={String(val)}
              </span>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default VariableStatePanel;
