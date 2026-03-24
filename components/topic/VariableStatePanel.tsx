'use client';
import React, { useEffect, useRef, useState } from 'react';

interface VariableStatePanelProps {
  variables: Record<string, string | number>;
}

export default function VariableStatePanel({ variables }: VariableStatePanelProps) {
  const prevVars = useRef<Record<string, string | number>>({});
  const [flashingKeys, setFlashingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newFlashing = new Set<string>();
    for (const key in variables) {
      if (prevVars.current[key] !== undefined && prevVars.current[key] !== variables[key]) {
        newFlashing.add(key);
      }
    }
    
    if (newFlashing.size > 0) {
      setFlashingKeys(newFlashing);
      const timer = setTimeout(() => {
        setFlashingKeys(new Set());
      }, 400);
      prevVars.current = { ...variables };
      return () => clearTimeout(timer);
    } else {
      prevVars.current = { ...variables };
    }
  }, [variables]);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius)] p-6">
       <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-4 block">Variable State</span>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(variables).map(([key, value]) => {
          const isFlashing = flashingKeys.has(key);
          return (
            <div key={key} className="flex flex-col">
              <span className="font-dmmono text-xs text-[var(--text-secondary)] mb-1 truncate" title={key}>{key}</span>
              <span className={`font-dmmono text-[20px] font-bold px-2 py-0.5 rounded transition-colors duration-400 inline-block w-max ${
                isFlashing ? 'bg-[var(--accent-amber)] text-white' : 'text-[var(--text-primary)] bg-transparent'
              }`}>
                {value}
              </span>
            </div>
          );
        })}
       </div>
    </div>
  );
}
