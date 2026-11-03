import { hasTracer, loadTracer } from '@/lib/tracers'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import type { TracerId } from '@/lib/engine/types'
import type { CurriculumLesson, LessonV2 } from '@/types/learning'

import { CheckSection } from './CheckSection'
import { CodeSection } from './CodeSection'
import { ExamplesSection } from './ExamplesSection'
import { HookSection } from './HookSection'
import { LessonFooter } from './LessonFooter'
import { LessonHeader } from './LessonHeader'
import { LessonShell } from './LessonShell'
import { LessonStrip } from './LessonStrip'
import { MentalModelSection } from './MentalModelSection'
import { PictureSection } from './PictureSection'
import { PracticeSection } from './PracticeSection'
import { RecognitionSection } from './RecognitionSection'
import { WatchSection } from './WatchSection'
import { eyebrow, numberSections, presentSteps } from './sections'
import type { SectionId } from './sections'

export interface LessonPageProps {
  lesson: LessonV2
  meta: CurriculumLesson
  /** Server-rendered code, keyed by code ref / tracer id. Missing entries are tolerated. */
  code: Partial<Record<TracerId, RenderedCodeProp>>
}

/** Anchor ids in Rule Rail order. Empty when the tracer cannot be loaded (the page falls back to pseudocode order). */
async function loadAnchorOrder(tracer: string): Promise<string[]> {
  if (!hasTracer(tracer)) return []
  try {
    return Object.keys((await loadTracer(tracer)).anchors)
  } catch (error) {
    console.error(`[lesson] could not read anchors for tracer "${tracer}":`, error)
    return []
  }
}

/**
 * The v2 lesson page. Server component: prose sections render on the server and
 * the interactive ones (Stage, quizzes, practice) are client islands inside LessonShell.
 *
 * Order: header, step strip, Picture, Hook, Mental model, Watch, Recognise, Code,
 * Examples, Check, Practice, footer. Code comes last on purpose.
 */
export async function LessonPage({ lesson, meta, code }: LessonPageProps) {
  const present = new Set<SectionId>(['picture', 'hook', 'mental-model', 'watch', 'recognise', 'code'])
  if (lesson.examples.length > 0) present.add('examples')
  if (lesson.conceptQuiz.length > 0) present.add('check')
  if (lesson.practice.length > 0) present.add('practice')

  const numbered = numberSections(present)
  const steps = presentSteps(present)
  const outline = numbered.map((section) => ({ id: section.id, label: section.label }))
  const eb = (id: SectionId) => eyebrow(numbered, id)
  const anchorOrder = await loadAnchorOrder(lesson.template.tracer)

  return (
    <LessonShell slug={meta.slug} steps={steps} outline={outline}>
      <LessonHeader meta={meta} />
      {/* A direct child of <main> so the strip stays sticky for the whole page. */}
      <LessonStrip />

      <div className="mt-10 flex flex-col gap-12 md:gap-16">
        <PictureSection shape={lesson.shape} eyebrow={eb('picture')} />
        <HookSection hook={lesson.hook} eyebrow={eb('hook')} />
        <MentalModelSection model={lesson.mentalModel} eyebrow={eb('mental-model')} />
        <WatchSection stage={lesson.stage} code={code} eyebrow={eb('watch')} />
        <RecognitionSection slug={meta.slug} recognise={lesson.recognise} eyebrow={eb('recognise')} />
        <CodeSection
          template={lesson.template}
          title={meta.title}
          code={code}
          anchorOrder={anchorOrder}
          eyebrow={eb('code')}
        />
        {present.has('examples') ? <ExamplesSection examples={lesson.examples} code={code} eyebrow={eb('examples')} /> : null}
        {present.has('check') ? <CheckSection slug={meta.slug} questions={lesson.conceptQuiz} eyebrow={eb('check')} /> : null}
        {present.has('practice') ? <PracticeSection problems={lesson.practice} eyebrow={eb('practice')} /> : null}
        <LessonFooter slug={meta.slug} />
      </div>
    </LessonShell>
  )
}

export default LessonPage
