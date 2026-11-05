'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';

import { ProgressBar } from './ProgressBar';
import { usePathProgress } from './usePathProgress';

/** Progress bar + Start/Continue button at the top of a path page. */
export function PathHeaderProgress({ slugs }: { slugs: string[] }) {
  const p = usePathProgress(slugs);
  const label = p.complete ? 'Review' : p.started ? 'Continue' : 'Start';
  const target = p.mounted && p.nextSlug ? p.nextSlug : slugs[0];

  return (
    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className={cn('w-full max-w-[420px]', !p.mounted && 'invisible')}>
        <ProgressBar percent={p.percent} />
        <p className="mt-2 text-[13px] tabular-nums text-ink-3">
          {p.done} of {p.total} done
        </p>
      </div>
      <Button href={`/learn/${target}`} variant={p.complete ? 'secondary' : 'primary'} className="self-start">
        {label}
      </Button>
    </div>
  );
}
