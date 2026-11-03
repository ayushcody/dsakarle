import { create } from 'zustand';

interface PaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  openPalette: () => void
  closePalette: () => void
}

/** Open/closed state of the global ⌘K command palette (mounted once by SiteHeader). */
export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
}));
