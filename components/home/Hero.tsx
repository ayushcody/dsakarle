import { Kbd } from '@/components/ui';

import { HeroActions } from './HeroActions';
import { HeroStage } from './HeroStage';

export function Hero() {
  return (
    <section aria-labelledby="home-title">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:px-8">
        <div className="flex flex-col items-start gap-6">
          <h1 id="home-title" className="t-display text-ink">
            Watch algorithms <span className="text-coral-ink">think.</span>
          </h1>
          <p className="t-body max-w-[32rem] text-ink-2">
            Learn data structures and algorithms by stepping through them, one small move at a time, until the
            patterns feel familiar.
          </p>
          <HeroActions />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-hand text-[24px] leading-none text-coral-ink">
              go on, step it yourself <span aria-hidden="true">↓</span>
            </span>
            <span className="t-caption text-ink-3">
              Press <Kbd>→</Kbd> or <Kbd>▶</Kbd>
            </span>
          </p>
          <div className="rounded-card border border-rule bg-paper-raised p-1.5 sm:p-2">
            <HeroStage />
          </div>
        </div>
      </div>
    </section>
  );
}
