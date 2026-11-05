'use client'

import { ScrollRegion } from '@/components/stage/primitives/ScrollRegion'
import { ScenePicture } from '@/components/stage/scenes/ScenePicture'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** The static Picture with handwritten callouts, on a paper card. Sits above the fold with the header. */
export function PictureSection({ shape }: { shape: LessonV2['shape'] }) {
  return (
    <SectionFrame id="picture" width="wide">
      <figure className="m-0">
        <ScrollRegion label="The picture, scrolls sideways" className="rounded-card border border-rule bg-paper-raised p-4 sm:p-6">
          <ScenePicture scene={shape.scene} callouts={shape.callouts} />
        </ScrollRegion>
      </figure>
    </SectionFrame>
  )
}
