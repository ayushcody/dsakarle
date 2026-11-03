import { Disclosure } from '@/components/ui/Disclosure'
import { Prose } from '@/components/ui/Prose'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/**
 * An everyday metaphor, the one sentence that makes it click (pull-quote), and
 * the glossary — margin notes on wide screens, a compact list below that.
 */
export function MentalModelSection({ model, eyebrow }: { model: LessonV2['mentalModel']; eyebrow: string }) {
  const { metaphor, click, glossary, definition } = model
  return (
    <SectionFrame id="mental-model" eyebrow={eyebrow} title="Think of it like this" width="wide">
      <div className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_200px] 2xl:gap-10">
        <div className="min-w-0 max-w-[760px]">
          <Prose>
            {metaphor.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </Prose>

          <figure className="my-8">
            <blockquote className="border-l-4 border-coral pl-5 font-serif text-[22px] font-medium leading-8 text-ink sm:text-[26px] sm:leading-9">
              {click}
            </blockquote>
            <figcaption className="t-eyebrow mt-3 pl-5">The click</figcaption>
          </figure>

          {definition ? (
            <Disclosure title="Formal definition">
              <p className="text-ink">{definition}</p>
            </Disclosure>
          ) : null}
        </div>

        {glossary.length > 0 ? (
          <aside
            aria-label="Glossary"
            className="mt-8 max-w-[760px] rounded-card border border-rule bg-paper-sunken p-4 2xl:mt-0 2xl:max-w-none 2xl:rounded-none 2xl:border-0 2xl:border-l 2xl:bg-transparent 2xl:py-0 2xl:pl-4 2xl:pr-0"
          >
            <p className="t-eyebrow mb-3">Words to know</p>
            <dl className="space-y-3">
              {glossary.map((entry) => (
                <div key={entry.term}>
                  <dt className="font-serif text-[16px] font-semibold text-ink">{entry.term}</dt>
                  <dd className="text-[14px] leading-5 text-ink-2">{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </div>
    </SectionFrame>
  )
}
