'use client'

import type { ReactNode } from 'react'

import { cn, focusRing } from '@/components/ui/cn'

/** Toggle chip for choosing a question set. Coral ink marks the selected one (plus a check, not colour alone). */
export function ModeChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        focusRing,
        'inline-flex min-h-[44px] items-center gap-1.5 rounded-card border px-4 text-[15px] font-medium transition-colors motion-reduce:transition-none',
        selected
          ? 'border-coral-ink bg-coral-wash text-coral-ink'
          : 'border-rule bg-paper-raised text-ink-2 hover:border-rule-strong hover:bg-paper-sunken',
      )}
    >
      {selected ? <span aria-hidden="true">✓</span> : null}
      {children}
    </button>
  )
}
