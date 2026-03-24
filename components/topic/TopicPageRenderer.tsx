import React from 'react';

import type { TopicPage } from '@/types';

import Sidebar from './Sidebar';
import TheoryBlock from './TheoryBlock';
import DiagramBlock from './DiagramBlock';
import StepperBlock from './StepperBlock';
import CalloutBlock from './CalloutBlock';
import PatternTemplate from './PatternTemplate';
import ExampleCard from './ExampleCard';
import RecognitionQuiz from './RecognitionQuiz';
import ConceptQuiz from './ConceptQuiz';
import PracticeList from './PracticeList';

function renderDifficultyChip(difficulty: TopicPage['difficulty']) {
  const classes = {
    beginner: 'badge-pill badge-pill-teal',
    intermediate: 'badge-pill badge-pill-amber',
    advanced: 'badge-pill badge-pill-coral',
  };

  return <span className={classes[difficulty]}>{difficulty}</span>;
}

export default function TopicPageRenderer({ data }: { data: TopicPage }) {
  const showFullContent = !data.isPlaceholder && data.content.length > 0;
  const hasExamples = data.examples.length > 0;
  const hasQuizSection = Boolean(data.recognitionQuiz) || data.conceptQuiz.length > 0;
  const hasPractice = data.practice.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="border-b border-[var(--border-strong)] bg-[var(--bg-dark)] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3 font-dmmono text-xs uppercase tracking-widest text-[var(--text-inverse-muted)]">
            <span>Learn</span>
            <span className="text-[var(--text-inverse-subtle)]">/</span>
            <span className="text-[var(--accent-coral)]">{data.category}</span>
          </div>

          <h1 className="mb-6 font-lora text-4xl font-bold text-[var(--white)] md:text-6xl">{data.title}</h1>
          <p className="max-w-3xl font-dmsans text-[18px] leading-relaxed text-[var(--text-inverse-muted)] md:text-[20px]">
            {data.overview.summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <span className="badge-pill badge-pill-dark">{data.estimatedMinutes} min</span>
            {renderDifficultyChip(data.difficulty)}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-start gap-12 px-6 py-12">
        <div className="min-w-0 flex-1">
          <section id="overview" className="mb-16">
            {data.isPlaceholder && (
              <div className="surface-muted mb-10 rounded-[var(--radius)] border border-[var(--border)] p-6">
                <span className="badge-pill badge-pill-amber">Coming Soon</span>
                <p className="mt-4 font-dmsans text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  This topic route is now stable and published, but the full visual walkthrough has not been authored yet.
                </p>
              </div>
            )}

            <h2 className="mb-6 font-dmsans text-2xl font-bold text-[var(--text-primary)]">Learning Objectives</h2>
            <ul className="space-y-4">
              {data.overview.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-coral)] text-[var(--accent-coral)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="font-dmsans text-[16px] leading-relaxed text-[var(--text-secondary)]">{objective}</span>
                </li>
              ))}
            </ul>
          </section>

          {showFullContent && (
            <section id="theory" className="mb-16 scroll-mt-24">
              <h2 className="section-heading">1. The Intuition</h2>
              {data.content.map((block, index) => {
                if (block.type === 'theory') {
                  return <TheoryBlock key={index} content={block.content} />;
                }

                if (block.type === 'diagram') {
                  return <DiagramBlock key={index} id={block.id || data.id} />;
                }

                if (block.type === 'callout') {
                  return (
                    <CalloutBlock
                      key={index}
                      type={block.calloutType}
                      title={block.title}
                      content={block.content}
                    />
                  );
                }

                if (block.type === 'stepper') {
                  return (
                    <div id="stepper" key={index} className="my-16 scroll-mt-24">
                      <h2 className="section-heading">2. Interactive Stepper</h2>
                      <StepperBlock
                        steps={block.steps}
                        codeHtml={block.codeHtml}
                        diagramType={block.diagramType || 'array'}
                        arrayCells={block.arrayCells}
                        constraintLabel={block.constraintLabel}
                      />
                    </div>
                  );
                }

                return null;
              })}

              <PatternTemplate
                pseudocode={data.patternTemplate.pseudocode}
                whenToUse={data.patternTemplate.whenToUse}
                timeComplexity={data.patternTemplate.timeComplexity}
                spaceComplexity={data.patternTemplate.spaceComplexity}
              />
            </section>
          )}

          {hasExamples && (
            <section id="examples" className="mb-16 scroll-mt-24">
              <h2 className="section-heading">3. Walkthrough Examples</h2>
              {data.examples.map((example, index) => (
                <ExampleCard key={index} example={example} />
              ))}
            </section>
          )}

          {hasQuizSection && (
            <section id="quizzes" className="mb-16 scroll-mt-24">
              <h2 className="section-heading">4. Knowledge Check</h2>
              {data.recognitionQuiz && (
                <RecognitionQuiz
                  problemStatement={data.recognitionQuiz.problemStatement}
                  correctPatternId={data.recognitionQuiz.correctPatternId}
                  distractors={data.recognitionQuiz.distractors}
                  explanation={data.recognitionQuiz.explanation}
                />
              )}

              {data.conceptQuiz.map((quiz, index) => (
                <ConceptQuiz
                  key={index}
                  question={quiz.question}
                  options={quiz.options}
                  correctIndex={quiz.correctIndex}
                  explanation={quiz.explanation}
                />
              ))}
            </section>
          )}

          {hasPractice && (
            <section id="practice" className="mb-24 scroll-mt-24">
              <h2 className="section-heading">5. Practice Bank</h2>
              <PracticeList items={data.practice} />
            </section>
          )}
        </div>

        {!data.isPlaceholder && <Sidebar />}
      </div>
    </div>
  );
}
