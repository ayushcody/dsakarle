'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { getBadgeForSlug } from '@/components/badges/registry';
import { saveQuizScore } from '@/lib/progress';
import type { RecognitionQuizData } from '@/types/learning';

export function RecognitionQuiz({ quiz, topicId }: { quiz: RecognitionQuizData; topicId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);

  const options = useMemo(() => {
    const unique = Array.from(new Set([quiz.correctPatternId, ...quiz.distractors]));
    return unique.slice(0, 4);
  }, [quiz.correctPatternId, quiz.distractors]);

  const handleSelect = (slug: string) => {
    if (revealed) {
      return;
    }

    setSelected(slug);
    saveQuizScore(topicId, 'recognition', slug === quiz.correctPatternId);

    if (slug === quiz.correctPatternId) {
      setRevealed(true);
      return;
    }

    setPendingReveal(true);
    window.setTimeout(() => {
      setPendingReveal(false);
      setRevealed(true);
    }, 800);
  };

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="section-heading">Section 09 — Recognition Quiz</h2>
      <div className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-5">
        <p className="font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{quiz.problemStatement}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((slug) => {
          const Badge = getBadgeForSlug(slug);
          const isCorrect = slug === quiz.correctPatternId;
          const isSelected = selected === slug;

          let className = 'border-[var(--border)] bg-white';
          if (revealed && isCorrect) {
            className = 'border-[var(--state-success)] bg-[var(--surface-success)]';
          } else if ((revealed || pendingReveal) && isSelected) {
            className = 'border-[var(--state-danger)] bg-[var(--surface-danger)]';
          }

          return (
            <button
              key={slug}
              className={`rounded-[var(--radius-sm)] border p-4 text-center transition-colors ${className}`}
              onClick={() => handleSelect(slug)}
            >
              <Badge className="mx-auto h-20 w-20" />
              <p className="mt-3 font-dmsans text-sm font-medium text-[var(--text-primary)]">
                {slug.replace(/-/g, ' ')}
              </p>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-6 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] px-5 py-4">
          <p className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            {selected === quiz.correctPatternId ? 'Correct' : 'Correct Pattern'}
          </p>
          <p className="mt-2 font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{quiz.explanation}</p>
          <Link href={`#worked-examples`} className="button-primary mt-4 inline-flex px-5 py-2.5">
            Continue to Examples →
          </Link>
        </div>
      )}
    </section>
  );
}

export default RecognitionQuiz;
