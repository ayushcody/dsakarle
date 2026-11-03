import { Kbd } from '@/components/ui';

import { HeroActions } from './HeroActions';
import { HeroStage } from './HeroStage';

export function Hero() {
  return (
    <section aria-labelledby="home-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:px-8">
        <div className="flex flex-col items-start gap-6">
          <p className="t-eyebrow">Data structures &amp; algorithms, visually</p>
          <h1 id="home-title" className="t-display text-ink">
            Watch algorithms <span className="text-coral-ink">think.</span>
          </h1>
          <p className="t-body max-w-[34rem] text-ink-2">
            Picture the idea, watch it run step by step, predict the next move and try your own input. Then read the
            code in Python, Java or C++.
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
          <HeroStage />
        </div>
      </div>
    </section>
  );
}
