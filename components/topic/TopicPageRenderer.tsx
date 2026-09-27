'use client';

import dynamic from 'next/dynamic';

import courseStructure from '@/content/course-structure.json';
import { Sidebar } from '@/components/layout/Sidebar';
import type { CourseStructure, LearningTopicPage, CodeLanguage } from '@/types/learning';

import { TopicHero } from './TopicHero';
import { RealWorldHookSection } from './RealWorldHookSection';
import { CoreDefinitionSection } from './CoreDefinitionSection';
import { MentalModelSection } from './MentalModelSection';
import { StructureSection } from './StructureSection';
import { StepperBlock } from './StepperBlock';
import { OperationsSection } from './OperationsSection';
import { PatternTemplateSection } from './PatternTemplateSection';
import { RecognitionQuiz } from './RecognitionQuiz';
import { WorkedExamplesSection } from './WorkedExamplesSection';
import { ConceptQuiz } from './ConceptQuiz';
import { PracticeList } from './PracticeList';
import { MarkCompleteButton } from './MarkCompleteButton';
import { TopicNavigation } from './TopicNavigation';
import { RightSidebar, type OutlineItem } from './RightSidebar';
import { InteractiveDemoPanel } from './InteractiveDemoPanel';
import { CodePanel } from './CodePanel';

const VisualDebugger = dynamic(() => import('@/components/debugger/VisualDebugger').then(m => m.VisualDebugger), { ssr: false });
const ComplexityGauge = dynamic(() => import('@/components/visualizers/ComplexityGauge').then(m => m.ComplexityGauge), { ssr: false });

import { getBadgeForSlug } from '@/components/badges/registry';
import { DEBUGGER_CHALLENGES } from '@/content/debugger-challenges';

const emptyCode = {
  python: '',
  javascript: '',
  java: '',
  cpp: '',
} satisfies Record<CodeLanguage, string>;

const OBJECTIVE_ICONS = ['🏆', '⏱️', '🧩'];

function difficultyClass(d: string) {
  if (d === 'beginner' || d === 'easy') return 'bg-[rgba(30,123,108,0.14)] text-[var(--accent-teal)]';
  if (d === 'hard' || d === 'advanced') return 'bg-[rgba(204,90,55,0.14)] text-[var(--accent-coral)]';
  return 'bg-[rgba(217,155,38,0.16)] text-[var(--accent-amber)]';
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="stepper-card">
      <h2 className="topic-h2" style={{ marginTop: 0 }}>{title}</h2>
      <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center text-[var(--text-muted)] font-dmsans h-[200px] flex items-center justify-center mt-6">
        <p>Coming Soon: {title} for this topic.</p>
      </div>
    </section>
  );
}

export function TopicPageRenderer({
  topic,
  renderedCode,
}: {
  topic: LearningTopicPage
  renderedCode: Record<CodeLanguage, string>
}) {
  // Access analogy fields (may not exist on all topics)
  const topicAny = topic as LearningTopicPage & { analogy?: string; analogyIcon?: string };
  const groupTitle =
    (courseStructure as CourseStructure).groups.find((g) => g.topics.some((t) => t.slug === topic.slug))?.title ?? 'Topics';
  const Icon = getBadgeForSlug(topic.slug);
  const outline: OutlineItem[] = [
    { id: 'hook', label: 'Why it matters', show: !!topic.realWorldHook },
    { id: 'definition', label: 'Definition', show: !!topic.definition },
    { id: 'mental-model', label: 'Mental model', show: !!topic.mentalModel },
    { id: 'visualize', label: 'Visualization', show: true },
    { id: 'operations', label: 'Operations', show: !!topic.operations?.length },
    { id: 'template', label: 'Pattern template', show: !!topic.patternTemplate },
    { id: 'recognition', label: 'Recognition quiz', show: !!topic.recognitionQuiz },
    { id: 'examples', label: 'Worked examples', show: !!topic.examples?.length },
    { id: 'quiz', label: 'Concept quiz', show: !!topic.conceptQuiz?.length },
    { id: 'practice', label: 'Practice', show: !!topic.practice?.length }
  ].filter((o) => o.show);

  const objectives = topic.overview?.learningObjectives?.slice(0, 3) ?? [];

  return (
    <>
      <Sidebar currentSlug={topic.slug} courseStructure={courseStructure as CourseStructure} />

      <div className="md:ml-[280px] min-h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
        <div className="max-w-[1200px] mx-auto flex gap-12 px-6 lg:px-12 py-10">
          
          <main className="flex-1 max-w-[800px] flex flex-col gap-8">

            {/* Breadcrumb & Header */}
            <div>
              <div className="font-dmsans text-[13px] text-[var(--text-muted)] font-medium mb-6">
                {groupTitle} <span className="mx-2">&gt;</span> <span className="text-[var(--text-primary)]">{topic.title}</span>
              </div>

              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 text-[var(--accent-coral)]">
                  <Icon width={44} height={44} />
                </div>
                <div>
                  <h1 className="font-dmsans text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
                    {topic.title}
                  </h1>
                  {topic.definition?.technicalDefinition && (
                    <p className="font-dmsans text-[var(--text-secondary)] text-lg mb-4 max-w-2xl">
                      {topic.definition.technicalDefinition}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-md ${difficultyClass(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold uppercase tracking-widest rounded-md">
                      {topic.estimatedMinutes} Min
                    </span>
                  </div>
                </div>
              </div>

              {objectives.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                  {objectives.map((text, i) => (
                    <div key={text} className="bg-[var(--white)] border border-[var(--border)] rounded-lg p-4 flex items-start gap-3 shadow-sm">
                      <span className="text-[var(--accent-coral)] mt-0.5">{OBJECTIVE_ICONS[i]}</span>
                      <p className="font-dmsans text-sm font-medium text-[var(--text-primary)]">{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rest of the content */}
            {topicAny.analogy ? (
              <TopicHero
                slug={topic.slug}
                title={topic.title}
                analogy={topicAny.analogy}
                analogyIcon={topicAny.analogyIcon}
              />
            ) : null}


        <div id="hook" className="scroll-mt-24" />
        {topic.realWorldHook && (
          <RealWorldHookSection
            paragraphs={topic.realWorldHook.paragraphs}
            ahaMoment={topic.realWorldHook.ahaMoment}
          />
        )}

        <div id="definition" className="scroll-mt-24" />
        {topic.definition && (
          <CoreDefinitionSection
            technicalDefinition={topic.definition.technicalDefinition}
            vocabulary={topic.definition.vocabulary}
            keyProperties={topic.definition.keyProperties}
          />
        )}

        <div id="mental-model" className="scroll-mt-24" />
        {topic.mentalModel && (
          <MentalModelSection
            metaphor={topic.mentalModel.metaphor}
            clickSentence={topic.mentalModel.clickSentence}
            diagramType={topic.mentalModel.diagramType}
            cells={topic.mentalModel.cells}
            diagramState={topic.mentalModel.diagramState}
          />
        )}

        {topic.structure && (
          <StructureSection
            memoryDescription={topic.structure.memoryDescription}
            definitionCode={topic.structure.definitionCode}
            memoryLayout={topic.structure.memoryLayout}
          />
        )}

        <div id="visualize" className="scroll-mt-24" />
        {topic.slug === 'sliding-window' ? (
          <section className="mb-12">
            <InteractiveDemoPanel />
            <CodePanel />
          </section>
        ) : topic.stepper && topic.stepper.steps.length > 0 ? (
          <section className="stepper-card">
            <h2 className="topic-h2" style={{ marginTop: 0 }}>Interactive Visualization</h2>
            <StepperBlock
              stepperData={topic.stepper}
              code={{ ...emptyCode, ...(topic.stepper.code ?? topic.examples?.[0]?.code) }}
              renderedCode={renderedCode}
            />
          </section>
        ) : (
          <Placeholder title="Interactive Visualization" />
        )}

        {/* Visual Debugger — Feature 2 */}
        {DEBUGGER_CHALLENGES[topic.slug] && DEBUGGER_CHALLENGES[topic.slug].length > 0 && (
          DEBUGGER_CHALLENGES[topic.slug].map((challenge) => (
            <VisualDebugger key={challenge.id} challenge={challenge} />
          ))
        )}

        <div id="operations" className="scroll-mt-24" />
        {topic.operations && topic.operations.length > 0 ? (
          <OperationsSection operations={topic.operations} />
        ) : (
          <Placeholder title="Operations Deep Dive" />
        )}

        <div id="template" className="scroll-mt-24" />
        {topic.patternTemplate ? (
          <PatternTemplateSection template={topic.patternTemplate} />
        ) : (
          <Placeholder title="Pattern Template" />
        )}

        <div id="recognition" className="scroll-mt-24" />
        {topic.recognitionQuiz ? (
          <RecognitionQuiz quiz={topic.recognitionQuiz} topicId={topic.id} />
        ) : (
          <Placeholder title="Recognition Quiz" />
        )}

        <div id="examples" className="scroll-mt-24" />
        {topic.examples && topic.examples.length > 0 ? (
          <WorkedExamplesSection examples={topic.examples} />
        ) : (
          <Placeholder title="Worked Examples" />
        )}

        <div id="quiz" className="scroll-mt-24" />
        {topic.conceptQuiz && topic.conceptQuiz.length > 0 ? (
          <ConceptQuiz questions={topic.conceptQuiz} topicId={topic.id} />
        ) : (
          <Placeholder title="Concept Quiz" />
        )}

        {/* Complexity Gauge — Feature 4 */}
        {topic.patternTemplate?.timeComplexity && (
          <ComplexityGauge
            highlight={[
              topic.patternTemplate.timeComplexity as 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)',
            ]}
            title={`How ${topic.title} Scales`}
          />
        )}

        <div id="practice" className="scroll-mt-24" />
        {topic.practice && topic.practice.length > 0 ? (
          <PracticeList problems={topic.practice} />
        ) : (
          <Placeholder title="Practice Problems" />
        )}

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-[var(--border)]">
          <TopicNavigation currentSlug={topic.slug} />
        </div>

        <div className="flex justify-center mt-4">
          <MarkCompleteButton topicId={topic.id} />
        </div>

      </main>

      <RightSidebar topicId={topic.id} outline={outline} quizTotal={topic.conceptQuiz?.length ?? 0} />
      
      </div>
      </div>
    </>
  );
}

export default TopicPageRenderer;
