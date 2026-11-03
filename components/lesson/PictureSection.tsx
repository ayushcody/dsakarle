'use client'

import { ScenePicture } from '@/components/stage/scenes/ScenePicture'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** The static Picture with handwritten callouts, on a paper card. Sits above the fold with the header. */
export function PictureSection({ shape, eyebrow }: { shape: LessonV2['shape']; eyebrow: string }) {
  return (
    <SectionFrame id="picture" eyebrow={eyebrow} title="The shape of it">
      <figure className="m-0">
        <div className="overflow-x-auto rounded-card border border-rule bg-paper-raised p-4 shadow-1 sm:p-6">
          <ScenePicture scene={shape.scene} callouts={shape.callouts} />
        </div>
      </figure>
    </SectionFrame>
  )
}
