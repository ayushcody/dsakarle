'use client';

import dynamic from 'next/dynamic';

import courseStructure from '@/content/course-structure.json';
import { Sidebar } from '@/components/layout/Sidebar';
import type { CourseStructure, LearningTopicPage, CodeLanguage } from '@/types/learning';

import { TopicHero } from './TopicHero';
import { HeroBlock } from './HeroBlock';
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
import { RightSidebar } from './RightSidebar';
import { InteractiveDemoPanel } from './InteractiveDemoPanel';
import { CodePanel } from './CodePanel';

const VisualDebugger = dynamic(() => import('@/components/debugger/VisualDebugger').then(m => m.VisualDebugger), { ssr: false });
const ComplexityGauge = dynamic(() => import('@/components/visualizers/ComplexityGauge').then(m => m.ComplexityGauge), { ssr: false });

import { DEBUGGER_CHALLENGES } from '@/content/debugger-challenges';

const emptyCode = {
  python: '',
  javascript: '',
  java: '',
  cpp: '',
} satisfies Record<CodeLanguage, string>;

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

  return (
    <>
      <Sidebar currentSlug={topic.slug} courseStructure={courseStructure as CourseStructure} />

      <div className="md:ml-[280px] min-h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
        <div className="max-w-[1200px] mx-auto flex gap-12 px-6 lg:px-12 py-10">
          
          <main className="flex-1 max-w-[800px] flex flex-col gap-8">

            {/* Breadcrumb & Header */}
            <div>
              <div className="font-dmsans text-[13px] text-[var(--text-muted)] font-medium mb-6">
                Algorithms <span className="mx-2">&gt;</span> <span className="text-[var(--text-primary)]">{topic.title}</span>
              </div>
              
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 text-[var(--accent-coral)]">
                  {/* Icon placeholder based on reference */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="8" x2="20" y2="8"></line>
                    <line x1="4" y1="16" x2="20" y2="16"></line>
                    <circle cx="8" cy="8" r="2" fill="currentColor"></circle>
                    <circle cx="16" cy="16" r="2" fill="currentColor"></circle>
                  </svg>
                </div>
                <div>
                  <h1 className="font-dmsans text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
                    {topic.title}
                  </h1>
                  <p className="font-dmsans text-[var(--text-secondary)] text-lg mb-4 max-w-2xl">
                    {topic.definition?.technicalDefinition || `A powerful technique that uses a window of elements to solve problems efficiently in linear time.`}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[var(--surface-success)] bg-opacity-20 text-[var(--state-success)] text-xs font-bold uppercase tracking-widest rounded-md">
                      Beginner
                    </span>
                    <span className="px-3 py-1 bg-[var(--text-primary)] text-white text-xs font-bold uppercase tracking-widest rounded-md">
                      35 Min
                    </span>
                  </div>
                </div>
              </div>

              {/* Objective Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                <div className="bg-[var(--white)] border border-[var(--border)] rounded-lg p-4 flex items-start gap-3 shadow-sm">
                  <span className="text-[var(--accent-coral)] mt-0.5">🏆</span>
                  <p className="font-dmsans text-sm font-medium text-[var(--text-primary)]">Master window expansion and contraction patterns</p>
                </div>
                <div className="bg-[var(--white)] border border-[var(--border)] rounded-lg p-4 flex items-start gap-3 shadow-sm">
                  <span className="text-[var(--accent-coral)] mt-0.5">⏱️</span>
                  <p className="font-dmsans text-sm font-medium text-[var(--text-primary)]">Solve problems in O(n) time using optimal windows</p>
                </div>
                <div className="bg-[var(--white)] border border-[var(--border)] rounded-lg p-4 flex items-start gap-3 shadow-sm">
                  <span className="text-[var(--accent-coral)] mt-0.5">🧩</span>
                  <p className="font-dmsans text-sm font-medium text-[var(--text-primary)]">Apply to arrays, strings & sequence problems</p>
                </div>
              </div>
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

        <HeroBlock topic={topic} />

        {topic.realWorldHook && (
          <RealWorldHookSection
            paragraphs={topic.realWorldHook.paragraphs}
            ahaMoment={topic.realWorldHook.ahaMoment}
          />
        )}

        {topic.definition && (
          <CoreDefinitionSection
            technicalDefinition={topic.definition.technicalDefinition}
            vocabulary={topic.definition.vocabulary}
            keyProperties={topic.definition.keyProperties}
          />
        )}

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
              code={topic.examples?.[0]?.code || emptyCode}
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

        {topic.operations && topic.operations.length > 0 ? (
          <OperationsSection operations={topic.operations} />
        ) : (
          <Placeholder title="Operations Deep Dive" />
        )}

        {topic.patternTemplate ? (
          <PatternTemplateSection template={topic.patternTemplate} />
        ) : (
          <Placeholder title="Pattern Template" />
        )}

        {topic.recognitionQuiz ? (
          <RecognitionQuiz quiz={topic.recognitionQuiz} topicId={topic.id} />
        ) : (
          <Placeholder title="Recognition Quiz" />
        )}

        {topic.examples && topic.examples.length > 0 ? (
          <WorkedExamplesSection examples={topic.examples} />
        ) : (
          <Placeholder title="Worked Examples" />
        )}

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

      <RightSidebar />
      
      </div>
      </div>
    </>
  );
}

export default TopicPageRenderer;
