import { Button } from '@/components/ui';

import { Reveal } from './Reveal';

export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-4 sm:px-6 md:pb-24 lg:px-8">
      <Reveal>
        <div className="flex flex-col items-center gap-5 rounded-card border border-rule bg-paper-raised px-6 py-12 text-center md:py-16">
          <h2 id="cta-title" className="t-h1 max-w-[26ch] text-ink">
            Your first lesson takes about 25 minutes.
          </h2>
          <p className="t-body max-w-[32rem] text-ink-2">Nothing to install and no account. Just open it and press play.</p>
          <Button href="/learn/arrays" size="lg" trailingIcon="→">
            Start with Arrays
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
