import { Callout } from '@/components/ui/Callout'
import { Prose } from '@/components/ui/Prose'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** Introduction: the puzzle as a short bold lead, the story, then the aha as a callout. */
export function HookSection({ hook }: { hook: LessonV2['hook'] }) {
  return (
    <SectionFrame id="introduction">
      <p className="mb-4 text-[18px] font-semibold leading-8 text-ink">{hook.question}</p>
      <Prose>
        {hook.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Prose>
      <Callout variant="aha" title="Aha" className="mt-6">
        <p>{hook.aha}</p>
      </Callout>
    </SectionFrame>
  )
}
