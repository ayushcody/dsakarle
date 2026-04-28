'use client';



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

      <div style={{ marginLeft: '280px', minHeight: 'calc(100vh - 64px)' }}>
        <main className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-8 py-10">

        {/* Animated Topic Hero (if analogy exists, show new hero; else classic) */}
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

        {topic.stepper && topic.stepper.steps.length > 0 ? (
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

        {topic.practice && topic.practice.length > 0 ? (
          <PracticeList problems={topic.practice} />
        ) : (
          <Placeholder title="Practice Problems" />
        )}

        <MarkCompleteButton topicId={topic.id} />

        <TopicNavigation currentSlug={topic.slug} />
      </main>
      </div>
    </>
  );
}

export default TopicPageRenderer;
