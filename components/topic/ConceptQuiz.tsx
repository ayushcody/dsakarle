'use client';

import { useState } from 'react';

import { saveQuizScore } from '@/lib/progress';
import type { ConceptQuestion } from '@/types/learning';

export function ConceptQuiz({ questions, topicId }: { questions: ConceptQuestion[]; topicId: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctIndex ? 1 : 0);
  }, 0);

  const submit = () => {
    setSubmitted(true);
    saveQuizScore(topicId, 'concept', score);
  };

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="section-heading">Section 11 — Concept Quiz</h2>
      <div className="space-y-8">
        {questions.map((question, questionIndex) => (
          <div key={question.question} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] p-5">
            <p className="font-dmsans text-[16px] font-medium text-[var(--text-primary)]">{question.question}</p>
            <div className="mt-4 space-y-3">
              {question.options.map((option, optionIndex) => {
                const checked = answers[questionIndex] === optionIndex;
                const correct = submitted && optionIndex === question.correctIndex;
                const wrong = submitted && checked && optionIndex !== question.correctIndex;

                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3 ${
                      correct
                        ? 'border-[var(--state-success)] bg-[var(--surface-success)]'
                        : wrong
                          ? 'border-[var(--state-danger)] bg-[var(--surface-danger)]'
                          : 'border-[var(--border)] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`concept-${questionIndex}`}
                      checked={checked}
                      onChange={() => setAnswers((state) => ({ ...state, [questionIndex]: optionIndex }))}
                    />
                    <span className="font-dmsans text-[15px] text-[var(--text-primary)]">{option}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-4 font-dmsans text-sm leading-relaxed text-[var(--text-secondary)]">
                {question.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button className="button-primary inline-flex px-6 py-3" onClick={submit}>
          Submit Quiz
        </button>
        {submitted && (
          <span className="font-dmmono text-sm text-[var(--text-secondary)]">
            Score: {score} / {questions.length}
          </span>
        )}
      </div>
    </section>
  );
}

export default ConceptQuiz;
