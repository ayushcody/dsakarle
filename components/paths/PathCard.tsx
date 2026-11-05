'use client';

import Link from 'next/link';

import { GlyphTile } from '@/components/glyph';
import type { GlyphKey } from '@/components/glyph';
import { Button } from '@/components/ui/Button';
import { cn, focusRing } from '@/components/ui/cn';

import { ProgressBar } from './ProgressBar';
import { lessonWord } from './format';
import { usePathProgress } from './usePathProgress';

export interface PathCardProps {
  id: string
  title: string
  blurb: string
  glyph: GlyphKey
  minutes: number
  slugs: string[]
}

/** One large, flat path card (Odin style). Progress reads after mount; the server shows "Start path". */
export function PathCard({ id, title, blurb, glyph, minutes, slugs }: PathCardProps) {
  const p = usePathProgress(slugs);
  const label = p.complete ? 'Review' : p.started ? 'Continue' : 'Start path';
  const target = p.mounted && p.nextSlug ? p.nextSlug : slugs[0];

  return (
    <article
      aria-labelledby={`path-${id}`}
      className="rounded-card border border-rule bg-paper-raised p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <GlyphTile id={glyph} tileSize={48} glyphSize={48} decorative />
        <div className="min-w-0">
          <p className="t-eyebrow">Path</p>
          <h2 id={`path-${id}`} className="mt-1 font-sans text-[24px] font-semibold leading-8 text-ink">
            {title}
          </h2>
          <p className="mt-1 text-[14px] text-ink-3">
            {slugs.length} {lessonWord(slugs.length)} · about {minutes} min
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-[62ch] text-[16px] leading-7 text-ink-2">{blurb}</p>

      <div className={cn('mt-6 max-w-[520px]', !p.mounted && 'invisible')}>
        <ProgressBar percent={p.percent} />
        <p className="mt-2 text-[13px] tabular-nums text-ink-3">
          {p.done} of {p.total} done
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button href={`/learn/${target}`} variant={p.complete ? 'secondary' : 'primary'}>
          {label}
        </Button>
        <Link
          href={`/paths/${id}`}
          className={cn(
            'inline-flex min-h-[44px] items-center rounded-cell px-2 text-[15px] font-semibold text-coral-ink underline-offset-4 hover:underline',
            focusRing,
          )}
        >
          View lessons<span className="sr-only"> in {title}</span>
        </Link>
      </div>
    </article>
  );
}
