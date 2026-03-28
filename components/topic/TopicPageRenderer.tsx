'use client';

import { useEffect, useState } from 'react';

import courseStructure from '@/content/course-structure.json';
import { Sidebar } from '@/components/layout/Sidebar';
import type { CourseStructure, LearningTopicPage, CodeLanguage } from '@/types/learning';

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

const emptyCode = {
  python: '',
  javascript: '',
  java: '',
  cpp: '',
} satisfies Record<CodeLanguage, string>;

export function TopicPageRenderer({
  topic,
  renderedCode,
}: {
  topic: LearningTopicPage
  renderedCode: Record<CodeLanguage, string>
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [sidebarOpen]);

  return (
    <div className="mx-auto flex max-w-[1360px] gap-8 px-4 py-10 sm:px-6">
      <Sidebar currentSlug={topic.slug} courseStructure={courseStructure as CourseStructure} />
      <Sidebar
        currentSlug={topic.slug}
        courseStructure={courseStructure as CourseStructure}
        mode="drawer"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-8">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-4 py-2.5 font-dmmono text-xs uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[var(--shadow-card)]"
          >
            <span className="text-[var(--accent-coral)]">≡</span>
            Open Course Map
          </button>
        </div>

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

        {topic.stepper && topic.stepper.steps.length > 0 && (
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
            <h2 className="section-heading">Section 06 — StepperBlock</h2>
            <StepperBlock
              stepperData={topic.stepper}
              code={topic.examples?.[0]?.code || emptyCode}
              renderedCode={renderedCode}
            />
          </section>
        )}

        {topic.operations && topic.operations.length > 0 && <OperationsSection operations={topic.operations} />}

        {topic.patternTemplate && <PatternTemplateSection template={topic.patternTemplate} />}

        {topic.recognitionQuiz && <RecognitionQuiz quiz={topic.recognitionQuiz} topicId={topic.id} />}

        {topic.examples && topic.examples.length > 0 && <WorkedExamplesSection examples={topic.examples} />}

        {topic.conceptQuiz && topic.conceptQuiz.length > 0 && (
          <ConceptQuiz questions={topic.conceptQuiz} topicId={topic.id} />
        )}

        {topic.practice && topic.practice.length > 0 && <PracticeList problems={topic.practice} />}

        <MarkCompleteButton topicId={topic.id} />
      </main>
    </div>
  );
}

export default TopicPageRenderer;
