'use client'

import { Stage } from '@/components/stage/Stage'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import { Kbd } from '@/components/ui/Kbd'
import type { TracerId } from '@/lib/engine/types'
import type { LessonV2 } from '@/types/learning'

import { useLessonSteps } from './LessonShell'
import { SectionFrame } from './SectionFrame'

interface WatchSectionProps {
  stage: LessonV2['stage']
  code: Partial<Record<TracerId, RenderedCodeProp>>
  eyebrow: string
}

/** The interactive Stage in the wide column: guided run, predict prompts, and "your input". */
export function WatchSection({ stage, code, eyebrow }: WatchSectionProps) {
  const { markStep } = useLessonSteps()
  return (
    <SectionFrame
      id="watch"
      eyebrow={eyebrow}
      title="Step through it"
      width="wide"
      intro={
        <>
          Watch it run. Press <Kbd>→</Kbd> to step, or let it play.
          {stage.playground ? ' When you are ready, try your own input.' : ''}
        </>
      }
    >
      <Stage
        tracks={stage.tracks}
        playground={stage.playground}
        code={code}
        onGuidedFinish={() => markStep('watch')}
      />
    </SectionFrame>
  )
}
