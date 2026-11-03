/**
 * The lesson page's section list and the progress strip. One definition drives
 * the eyebrows ("4 · Watch"), the right-rail outline, and the strip, so the
 * three can never disagree.
 */

export type SectionId =
  | 'picture'
  | 'hook'
  | 'mental-model'
  | 'watch'
  | 'recognise'
  | 'code'
  | 'examples'
  | 'check'
  | 'practice'

export interface SectionDef {
  id: SectionId
  /** Short name used for the eyebrow and the outline. */
  label: string
}

/** Every section a lesson can have, in page order. */
export const SECTION_DEFS: readonly SectionDef[] = [
  { id: 'picture', label: 'Picture' },
  { id: 'hook', label: 'Hook' },
  { id: 'mental-model', label: 'Mental model' },
  { id: 'watch', label: 'Watch it run' },
  { id: 'recognise', label: 'Recognise' },
  { id: 'code', label: 'Code' },
  { id: 'examples', label: 'Examples' },
  { id: 'check', label: 'Check' },
  { id: 'practice', label: 'Practice' },
] as const

export interface StepDef {
  key: string
  label: string
  /** Section the item scrolls to. */
  target: SectionId
  /** The item ticks once this section has been scrolled past. */
  endId: SectionId
}

/** The horizontal progress strip, in the order the page presents them. */
export const STEP_DEFS: readonly StepDef[] = [
  { key: 'picture', label: 'Picture', target: 'picture', endId: 'picture' },
  { key: 'hook', label: 'Hook', target: 'hook', endId: 'mental-model' },
  { key: 'watch', label: 'Watch', target: 'watch', endId: 'watch' },
  { key: 'try', label: 'Try', target: 'watch', endId: 'watch' },
  { key: 'recognise', label: 'Recognise', target: 'recognise', endId: 'recognise' },
  { key: 'code', label: 'Code', target: 'code', endId: 'examples' },
  { key: 'practice', label: 'Practice', target: 'practice', endId: 'practice' },
] as const

/** Sections actually rendered for a lesson, with 1-based numbers for eyebrows and the outline. */
export function numberSections(present: ReadonlySet<SectionId>): Array<SectionDef & { number: number }> {
  return SECTION_DEFS.filter((def) => present.has(def.id)).map((def, index) => ({ ...def, number: index + 1 }))
}

/** Strip items whose target and end sections both exist, with the end section resolved to what is present. */
export function presentSteps(present: ReadonlySet<SectionId>): StepDef[] {
  const order = SECTION_DEFS.map((d) => d.id)
  return STEP_DEFS.flatMap((step) => {
    if (!present.has(step.target)) return []
    let endId = step.endId
    // If the end section is absent (e.g. no examples), the item ends at the last present section at or before it.
    while (!present.has(endId)) {
      const i = order.indexOf(endId)
      if (i <= 0) return []
      endId = order[i - 1]
    }
    return [{ ...step, endId }]
  })
}

export function eyebrow(numbered: Array<SectionDef & { number: number }>, id: SectionId): string {
  const found = numbered.find((s) => s.id === id)
  return found ? `${found.number} · ${found.label}` : ''
}
