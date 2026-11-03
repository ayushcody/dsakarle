import { Callout } from '@/components/ui/Callout'
import { Prose } from '@/components/ui/Prose'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** The puzzle: a question the learner can't answer quickly yet, then the aha that resolves it. */
export function HookSection({ hook, eyebrow }: { hook: LessonV2['hook']; eyebrow: string }) {
  return (
    <SectionFrame id="hook" eyebrow={eyebrow} title={hook.question}>
      <Prose>
        {hook.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Prose>
      <Callout variant="aha" title="The aha" className="mt-6">
        <p>{hook.aha}</p>
      </Callout>
    </SectionFrame>
  )
}
