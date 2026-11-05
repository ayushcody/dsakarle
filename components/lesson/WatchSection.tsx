'use client'

import { Stage } from '@/components/stage/Stage'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import type { TracerId } from '@/lib/engine/types'
import type { LessonV2 } from '@/types/learning'

import { useLessonReading } from './LessonShell'
import { SectionFrame } from './SectionFrame'

interface WatchSectionProps {
  stage: LessonV2['stage']
  code: Partial<Record<TracerId, RenderedCodeProp>>
}

/** The interactive Stage in the wide column: guided run, predict prompts, and "your input". */
export function WatchSection({ stage, code }: WatchSectionProps) {
  const { markRead } = useLessonReading()
  return (
    <SectionFrame id="watch" width="wide">
      <p className="mx-auto -mt-2 mb-4 max-w-[720px] text-[14px] leading-6 text-ink-3">
        Step with → or Next. When a question pops up, make your guess.
        {stage.playground ? (
          <>
            {' '}
            <a href="#watch" className="rounded-cell text-coral-ink underline underline-offset-4">
              Try your own input
            </a>{' '}
            once the guided run ends.
          </>
        ) : null}
      </p>
      <Stage tracks={stage.tracks} playground={stage.playground} code={code} onGuidedFinish={() => markRead('watch')} />
    </SectionFrame>
  )
}
