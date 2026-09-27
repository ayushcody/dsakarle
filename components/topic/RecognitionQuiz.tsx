'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { saveQuizScore } from '@/lib/progress';
import { PATTERN_META } from '@/lib/patternMeta';
import type { RecognitionQuizData } from '@/types/learning';

export function RecognitionQuiz({ quiz, topicId }: { quiz: RecognitionQuizData; topicId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [shakeTarget, setShakeTarget] = useState<string | null>(null);

  const options = useMemo(() => {
    const unique = Array.from(new Set([quiz.correctPatternId, ...quiz.distractors]));
    return unique.slice(0, 4);
  }, [quiz.correctPatternId, quiz.distractors]);

  const handleSelect = (slug: string) => {
    if (revealed) return;

    setSelected(slug);
    saveQuizScore(topicId, 'recognition', slug === quiz.correctPatternId);

    if (slug === quiz.correctPatternId) {
      setRevealed(true);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#CC5A37', '#D99B26', '#1E7B6C'] });
      }
      return;
    }

    // Wrong answer: shake + increment wrong count
    setShakeTarget(slug);
    setWrongCount((prev) => prev + 1);
    setTimeout(() => {
      setShakeTarget(null);
      // Re-enable selection after 1.5s delay
      setSelected(null);
    }, 1500);
  };

  const handleReveal = () => {
    setSelected(quiz.correctPatternId);
    setRevealed(true);
  };

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--white)] px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="topic-h2" style={{ marginTop: 0 }}>
        🎯 Pattern Recognition
      </h2>

      {/* Problem statement */}
      <div className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-5">
        <p className="font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">
          {quiz.problemStatement}
        </p>
      </div>

      {/* Pattern option cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((slug) => {
          const meta = PATTERN_META[slug];
          const isCorrect = slug === quiz.correctPatternId;
          const isShaking = shakeTarget === slug;

          let borderColor = 'var(--border)';
          let bgColor = 'white';

          if (revealed && isCorrect) {
            borderColor = 'var(--state-success)';
            bgColor = 'var(--surface-success)';
          } else if (isShaking) {
            borderColor = 'var(--state-danger)';
            bgColor = 'var(--surface-danger)';
          }

          return (
            <motion.button
              key={slug}
              onClick={() => handleSelect(slug)}
              disabled={revealed || isShaking}
              animate={isShaking ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={isShaking ? { duration: 0.4 } : {}}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${borderColor}`,
                background: bgColor,
                padding: 20,
                textAlign: 'center',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'background 0.3s, border-color 0.3s',
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {meta?.icon ?? '❓'}
              </div>
              {/* Label */}
              <p
                style={{
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {meta?.label ?? slug.replace(/-/g, ' ')}
              </p>
              {/* Trigger hint */}
              <p
                style={{
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                {meta?.trigger ?? ''}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Wrong answer feedback with notThisWhen */}
      <AnimatePresence>
        {shakeTarget && !revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 16,
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-danger)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--state-danger)', fontWeight: 500 }}>
              ✗ Not this pattern.
            </p>
            {PATTERN_META[shakeTarget]?.notThisWhen && (
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {PATTERN_META[shakeTarget].label} doesn&apos;t apply when: {PATTERN_META[shakeTarget].notThisWhen}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal button after 2 wrong attempts */}
      {wrongCount >= 2 && !revealed && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={handleReveal}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-amber)',
              color: 'var(--accent-amber)',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Show Pattern 💡
          </button>
        </div>
      )}

      {/* Correct answer expansion */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-6 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] px-5 py-5"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{PATTERN_META[quiz.correctPatternId]?.icon ?? '✓'}</span>
              <span
                style={{
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--state-success)',
                }}
              >
                {PATTERN_META[quiz.correctPatternId]?.label ?? quiz.correctPatternId}
                {selected === quiz.correctPatternId && wrongCount === 0 ? ' — Correct!' : ''}
              </span>
            </div>

            {/* Why this pattern */}
            <p className="font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">
              {quiz.explanation}
            </p>

            {/* Trigger condition */}
            {PATTERN_META[quiz.correctPatternId]?.trigger && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-success)',
                  fontFamily: 'var(--font-dmmono)',
                  fontSize: 12,
                  color: 'var(--state-success)',
                }}
              >
                <strong>Pattern trigger:</strong> {PATTERN_META[quiz.correctPatternId].trigger}
              </div>
            )}

            <Link href="#worked-examples" className="button-primary mt-4 inline-flex px-5 py-2.5">
              Continue to Examples →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default RecognitionQuiz;
