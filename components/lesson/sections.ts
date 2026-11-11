/**
 * The lesson page's section list. One definition drives the headings, the
 * "Lesson contents" rail and the compact "On this page" list, so they can never
 * disagree. Ids are stable anchors (`/learn/arrays#watch`).
 */

export type SectionId =
  | 'introduction'
  | 'overview'
  | 'picture'
  | 'mental-model'
  | 'watch'
  | 'recognise'
  | 'code'
  | 'examples'
  | 'check'
  | 'assignment'
  | 'resources'

export interface SectionDef {
  id: SectionId
  /** Heading text, also the label in the contents list. */
  label: string
}

/** Every section a lesson can have, in page order. */
export const SECTION_DEFS: readonly SectionDef[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'overview', label: 'Lesson overview' },
  { id: 'picture', label: 'The picture' },
  { id: 'mental-model', label: 'Mental model' },
  { id: 'watch', label: 'Watch it run' },
  { id: 'recognise', label: 'Recognise it' },
  { id: 'code', label: 'The code' },
  { id: 'examples', label: 'Worked examples' },
  { id: 'check', label: 'Knowledge check' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'resources', label: 'Additional resources' },
] as const

export function sectionLabel(id: string): string {
  return SECTION_DEFS.find((def) => def.id === id)?.label ?? id
}

/** The sections that are actually rendered, in page order. */
export function presentSections(present: ReadonlySet<SectionId>): SectionDef[] {
  return SECTION_DEFS.filter((def) => present.has(def.id))
}
