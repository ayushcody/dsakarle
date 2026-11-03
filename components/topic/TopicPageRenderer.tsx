'use client';

import { useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

import { Sidebar } from '@/components/layout/Sidebar';
import type { LearningTopicPage, CodeLanguage } from '@/types/learning';

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

const VisualDebugger = dynamic(() => import('@/components/debugger/VisualDebugger').then(m => m.VisualDebugger), { ssr: false });
const ComplexityGauge = dynamic(() => import('@/components/visualizers/ComplexityGauge').then(m => m.ComplexityGauge), { ssr: false });

import { DEBUGGER_CHALLENGES } from '@/content/debugger-challenges';

const emptyCode = {
  python: '',
  javascript: '',
  java: '',
  cpp: '',
} satisfies Record<CodeLanguage, string>;

interface PageSection {
  id: string
  label: string
  node: ReactNode
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

  // Only sections that have real content are rendered, and the same list drives the Lesson Outline.
  const sections = useMemo<PageSection[]>(() => {
    const list: PageSection[] = [];
    const add = (id: string, label: string, node: ReactNode) => list.push({ id, label, node });

    if (topic.realWorldHook) {
      add('real-world-hook', 'Real-World Hook', (
        <RealWorldHookSection
          paragraphs={topic.realWorldHook.paragraphs}
          ahaMoment={topic.realWorldHook.ahaMoment}
        />
      ));
    }

    if (topic.definition) {
      add('core-definition', 'Core Definition', (
        <CoreDefinitionSection
          technicalDefinition={topic.definition.technicalDefinition}
          vocabulary={topic.definition.vocabulary}
          keyProperties={topic.definition.keyProperties}
        />
      ));
    }

    if (topic.mentalModel) {
      add('mental-model', 'Mental Model', (
        <MentalModelSection
          metaphor={topic.mentalModel.metaphor}
          clickSentence={topic.mentalModel.clickSentence}
          diagramType={topic.mentalModel.diagramType}
          cells={topic.mentalModel.cells}
          diagramState={topic.mentalModel.diagramState}
        />
      ));
    }

    if (topic.structure) {
      add('structure', 'Structure & Memory', (
        <StructureSection
          memoryDescription={topic.structure.memoryDescription}
          definitionCode={topic.structure.definitionCode}
          memoryLayout={topic.structure.memoryLayout}
        />
      ));
    }

    // Single-step steppers are stubs — only show the stepper when there is something to step through.
    if (topic.stepper && topic.stepper.steps.length > 1) {
      add('interactive-visualization', 'Interactive Visualization', (
        <section className="stepper-card">
          <h2 className="topic-h2" style={{ marginTop: 0 }}>Interactive Visualization</h2>
          <StepperBlock
            key={topic.slug}
            stepperData={topic.stepper}
            code={topic.examples?.[0]?.code || emptyCode}
            renderedCode={renderedCode}
          />
        </section>
      ));
    }

    // Visual Debugger — Feature 2
    const challenges = DEBUGGER_CHALLENGES[topic.slug];
    if (challenges && challenges.length > 0) {
      add('visual-debugger', 'Debugging Challenge', (
        <>
          {challenges.map((challenge) => (
            <VisualDebugger key={challenge.id} challenge={challenge} />
          ))}
        </>
      ));
    }

    if (topic.operations && topic.operations.length > 0) {
      add('operations', 'Operations Deep Dive', <OperationsSection operations={topic.operations} />);
    }

    if (topic.patternTemplate) {
      add('pattern-template', 'Pattern Template', <PatternTemplateSection template={topic.patternTemplate} />);
    }

    if (topic.recognitionQuiz) {
      add('recognition-quiz', 'Pattern Recognition', <RecognitionQuiz quiz={topic.recognitionQuiz} topicId={topic.id} />);
    }

    if (topic.examples && topic.examples.length > 0) {
      add('worked-examples', 'Worked Examples', <WorkedExamplesSection examples={topic.examples} />);
    }

    if (topic.conceptQuiz && topic.conceptQuiz.length > 0) {
      add('concept-quiz', 'Concept Quiz', <ConceptQuiz questions={topic.conceptQuiz} topicId={topic.id} />);
    }

    // Complexity Gauge — Feature 4
    if (topic.patternTemplate?.timeComplexity) {
      add('complexity', 'Complexity', (
        <ComplexityGauge
          highlight={[
            topic.patternTemplate.timeComplexity as 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)',
          ]}
          title={`How ${topic.title} Scales`}
        />
      ));
    }

    if (topic.practice && topic.practice.length > 0) {
      add('practice-problems', 'Practice Problems', <PracticeList problems={topic.practice} />);
    }

    return list;
  }, [topic, renderedCode]);

  const outline = useMemo(() => sections.map(({ id, label }) => ({ id, label })), [sections]);

  return (
    <>
      <Sidebar currentSlug={topic.slug} />

      <div className="md:ml-[280px] min-h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
        <div className="max-w-[1200px] mx-auto flex gap-12 px-6 xl:px-12 py-10">

          <main className="flex-1 min-w-0 max-w-[800px] flex flex-col gap-8">

            {/* Single page header: breadcrumb, badge, title, summary, difficulty/time, objectives */}
            <HeroBlock topic={topic} />

            {topicAny.analogy ? (
              <TopicHero
                slug={topic.slug}
                title={topic.title}
                analogy={topicAny.analogy}
                analogyIcon={topicAny.analogyIcon}
                showTitle={false}
              />
            ) : null}

            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24 flex flex-col gap-8">
                {section.node}
              </div>
            ))}

            <TopicNavigation currentSlug={topic.slug} />

            <MarkCompleteButton topicId={topic.id} />

          </main>

          <RightSidebar outline={outline} />

        </div>
      </div>
    </>
  );
}

export default TopicPageRenderer;
