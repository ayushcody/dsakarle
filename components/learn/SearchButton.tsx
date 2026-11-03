'use client';

import { Kbd, cn, focusRing } from '@/components/ui';
import { usePaletteStore } from '@/lib/palette-store';

/** Opens the global command palette (mounted by SiteHeader), styled like a search field. */
export function SearchButton() {
  const openPalette = usePaletteStore((state) => state.openPalette);
  return (
    <button
      type="button"
      onClick={openPalette}
      className={cn(
        focusRing,
        'flex min-h-[48px] w-full max-w-xl items-center gap-3 rounded-card border border-rule bg-paper-sunken px-4 text-left',
        'font-sans text-[15px] text-ink-3 transition-colors duration-150 hover:border-rule-strong hover:bg-paper-raised',
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.2 13.2L17 17" />
      </svg>
      <span className="flex-1">Search topics, patterns, and tags</span>
      <Kbd aria-hidden="true" className="hidden sm:inline-flex">
        ⌘K
      </Kbd>
    </button>
  );
}
