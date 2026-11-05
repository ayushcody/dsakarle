import { Button } from '@/components/ui';

import { Reveal } from './Reveal';

export function GymTeaser() {
  return (
    <section aria-labelledby="gym-title" className="border-t border-rule">
      <Reveal>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16 lg:px-8">
          <div className="max-w-[40rem]">
            <h2 id="gym-title" className="t-h2 text-ink">
              Spot the pattern
            </h2>
            <p className="t-body mt-2 text-ink-2">
              Read a problem, name the pattern it wants. Short drills that train the one skill interviews test.
            </p>
          </div>
          <Button href="/gym" variant="secondary" size="md" trailingIcon="→" className="self-start md:self-auto">
            Open the gym
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
