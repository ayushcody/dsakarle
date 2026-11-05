import { cn } from '@/components/ui/cn';

/** A flat, thin progress bar. Decorative: put the numbers in text next to it. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('h-2 w-full overflow-hidden rounded-full bg-rule', className)}>
      <div
        className="h-full rounded-full bg-coral-ink motion-safe:transition-[width] motion-safe:duration-500"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
