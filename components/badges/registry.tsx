import type { ComponentType, SVGProps } from 'react';

import { GlyphTile, glyphForSlug } from '@/components/glyph';

type BadgeComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Badges are now pattern glyphs. The old per-topic SVG badge files stay on disk
 * until Phase 5 but are no longer referenced here.
 *
 * Consumers render `<Badge />` (BadgeCard: 90px) or `<Badge className="h-[120px] w-[120px]" />`
 * (HeroBlock, ComingSoonTemplate): the tile takes its size from className when given.
 */
const cache = new Map<string, BadgeComponent>();

export function getBadgeForSlug(slug: string): BadgeComponent {
  const cached = cache.get(slug);
  if (cached) {
    return cached;
  }
  const glyph = glyphForSlug(slug);
  const Badge: BadgeComponent = ({ className }) => <GlyphTile id={glyph} className={className} decorative />;
  Badge.displayName = `GlyphBadge(${slug})`;
  cache.set(slug, Badge);
  return Badge;
}
