import { getLessonMeta } from '@/lib/curriculum'
import type { GlyphKey } from './paths'

export { Glyph, GlyphTile, strokeForSize } from './Glyph'
export type { GlyphProps, GlyphSize, GlyphTileProps } from './Glyph'
export { GLYPHS } from './paths'
export type { GlyphDef, GlyphKey } from './paths'

/** The glyph for a lesson slug (from the curriculum), or a neutral one for unknown slugs. */
export function glyphForSlug(slug: string): GlyphKey {
  return getLessonMeta(slug)?.glyph ?? 'generic'
}
