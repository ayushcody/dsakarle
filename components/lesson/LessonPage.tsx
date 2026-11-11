import { hasTracer, loadTracer } from '@/lib/tracers'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import type { TracerId } from '@/lib/engine/types'
import type { CurriculumLesson, LessonV2 } from '@/types/learning'

import { AssignmentSection } from './AssignmentSection'
import { CheckSection } from './CheckSection'
import { CodeSection } from './CodeSection'
import { ExamplesSection } from './ExamplesSection'
import { HookSection } from './HookSection'
import { LessonContents } from './LessonContents'
import { LessonFooter } from './LessonFooter'
import { LessonHeader } from './LessonHeader'
import { LessonShell } from './LessonShell'
import { MentalModelSection } from './MentalModelSection'
import { OverviewSection } from './OverviewSection'
import { PictureSection } from './PictureSection'
import { RecognitionSection } from './RecognitionSection'
import { ResourcesSection } from './ResourcesSection'
import { ResumeBar } from './ResumeBar'
import { WatchSection } from './WatchSection'
import { presentSections } from './sections'
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
 * The v2 lesson page, Odin-style: header, then anchored sections in a calm reading column,
 * with the interactive Stage as the centrepiece. Server component: prose renders on the
 * server; Stage, quizzes and assignment are client islands inside LessonShell.
 *
 * Order: Introduction, Lesson overview, The picture, Mental model, Watch it run,
 * Recognise it, The code, Worked examples, Knowledge check, Assignment, Additional resources.
 */
export async function LessonPage({ lesson, meta, code }: LessonPageProps) {
  const hasOverview = Boolean(lesson.overview && lesson.overview.length > 0)
  const hasResources = Boolean(lesson.resources && lesson.resources.length > 0)
  const present = new Set<SectionId>(['introduction', 'picture', 'mental-model', 'watch', 'recognise', 'code'])
  if (hasOverview) present.add('overview')
  if (lesson.examples.length > 0) present.add('examples')
  if (lesson.conceptQuiz.length > 0) present.add('check')
  if (lesson.practice.length > 0) present.add('assignment')
  if (hasResources) present.add('resources')

  const outline = presentSections(present).map((section) => ({ id: section.id, label: section.label }))
  const anchorOrder = await loadAnchorOrder(lesson.template.tracer)

  return (
    <LessonShell slug={meta.slug} outline={outline}>
      <LessonHeader meta={meta} />
      <ResumeBar />

      <div className="mt-8 xl:mt-0">
        <LessonContents variant="inline" />
      </div>

      <div className="mt-10 flex flex-col gap-14">
        <HookSection hook={lesson.hook} />
        {hasOverview ? <OverviewSection items={lesson.overview!} /> : null}
        <PictureSection shape={lesson.shape} />
        <MentalModelSection model={lesson.mentalModel} />
        <WatchSection stage={lesson.stage} code={code} />
        <RecognitionSection slug={meta.slug} recognise={lesson.recognise} />
        <CodeSection template={lesson.template} title={meta.title} code={code} anchorOrder={anchorOrder} />
        {present.has('examples') ? <ExamplesSection examples={lesson.examples} code={code} /> : null}
        {present.has('check') ? <CheckSection slug={meta.slug} questions={lesson.conceptQuiz} /> : null}
        {present.has('assignment') ? <AssignmentSection problems={lesson.practice} /> : null}
        {hasResources ? <ResourcesSection resources={lesson.resources!} /> : null}
        <LessonFooter slug={meta.slug} title={meta.title} />
      </div>
    </LessonShell>
  )
}

export default LessonPage
