import { Button } from '@/components/ui';
import { LESSONS } from '@/lib/curriculum';

import { Reveal } from './Reveal';

export function ClosingCta() {
  const first = LESSONS[0];
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-4 sm:px-6 md:pb-24 lg:px-8">
      <Reveal>
        <div className="flex flex-col items-center gap-6 rounded-card border border-rule bg-paper-raised px-6 py-12 text-center shadow-1 md:py-16">
          <h2 id="cta-title" className="t-h1 max-w-[20ch] text-ink">
            Pick one idea and watch it run.
          </h2>
          <p className="t-body max-w-[32rem] text-ink-2">It takes a few minutes, and nothing to install.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={`/learn/${first.slug}`} size="lg" trailingIcon="→">
              Start with {first.title}
            </Button>
            <Button href="/learn" variant="secondary" size="lg">
              Browse all {LESSONS.length} lessons
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
