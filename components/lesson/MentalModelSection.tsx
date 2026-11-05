import { Disclosure } from '@/components/ui/Disclosure'
import { Prose } from '@/components/ui/Prose'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** An everyday metaphor, the one sentence that makes it click (a calm pull-quote), the glossary, the formal definition. */
export function MentalModelSection({ model }: { model: LessonV2['mentalModel'] }) {
  const { metaphor, click, glossary, definition } = model
  return (
    <SectionFrame id="mental-model">
      <Prose>
        {metaphor.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Prose>

      <figure className="my-8 m-0">
        <blockquote className="m-0 border-l-2 border-rule-strong pl-5 text-[20px] font-medium leading-8 text-ink">
          {click}
        </blockquote>
      </figure>

      {glossary.length > 0 ? (
        <div className="mb-6">
          <h3 className="t-eyebrow mb-3">Words to know</h3>
          <dl className="m-0 grid gap-x-8 gap-y-4 md:grid-cols-2">
            {glossary.map((entry) => (
              <div key={entry.term}>
                <dt className="text-[15px] font-semibold text-ink">{entry.term}</dt>
                <dd className="m-0 text-[15px] leading-6 text-ink-2">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {definition ? (
        <Disclosure title="Formal definition">
          <p className="text-ink">{definition}</p>
        </Disclosure>
      ) : null}
    </SectionFrame>
  )
}
