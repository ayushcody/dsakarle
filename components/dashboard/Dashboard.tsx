'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useModalBehavior } from '@/components/layout/useModalBehavior';
import { ProgressBar } from '@/components/paths/ProgressBar';
import { Button } from '@/components/ui/Button';
import { cn, focusRing } from '@/components/ui/cn';
import { useProgress } from '@/hooks/useProgress';
import { PATHS, getLessonMeta, pathLessons, placeOf } from '@/lib/curriculum';
import { PROGRESS_EVENT } from '@/lib/progress';

import { readGymStats, readSolvedCount, resetAllProgress } from './storage';
import type { GymStats } from './storage';

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="mb-4 font-sans text-[20px] font-semibold leading-8 text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

const card = 'rounded-card border border-rule bg-paper-raised p-5 sm:p-6';

function ResetDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalBehavior(true, ref, onClose);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        aria-describedby="reset-desc"
        tabIndex={-1}
        className="relative w-full max-w-[440px] rounded-card border border-rule-strong bg-paper-raised p-6 shadow-2"
      >
        <h2 id="reset-title" className="font-sans text-[18px] font-semibold text-ink">Reset all progress?</h2>
        <p id="reset-desc" className="mt-2 text-[15px] leading-6 text-ink-2">
          This clears completed lessons, quiz scores, practice solved marks, gym scores and saved lesson positions from
          this browser. It can&rsquo;t be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} data-autofocus>Cancel</Button>
          <Button onClick={onConfirm}>Reset progress</Button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { progress, mounted } = useProgress();
  const [solved, setSolved] = useState(0);
  const [gym, setGym] = useState<GymStats | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSolved(readSolvedCount());
      setGym(readGymStats());
    };
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const closeConfirm = useCallback(() => setConfirming(false), []);

  const completed = new Set(progress.completedSections);
  const last = mounted ? getLessonMeta(progress.lastVisited) : undefined;
  const lastPlace = last ? placeOf(last.slug) : undefined;
  const recent = [...new Set(progress.completedSections)]
    .filter((slug) => getLessonMeta(slug))
    .slice(-5)
    .reverse();

  return (
    <>
      {/* Stable skeleton until localStorage is read: same markup on server and first client render. */}
      <div className={cn(!mounted && 'invisible')} aria-busy={!mounted}>
        <Section title="Continue" id="d-continue">
          <div className={cn(card, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
            {last ? (
              <>
                <div className="min-w-0">
                  <p className="t-eyebrow">{lastPlace?.path.title ?? 'Lesson'}</p>
                  <p className="mt-1 text-[18px] font-semibold leading-7 text-ink">{last.title}</p>
                  <p className="text-[14px] text-ink-3">{last.oneLiner}</p>
                </div>
                <Button href={`/learn/${last.slug}`} className="self-start sm:self-auto">Continue lesson</Button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[16px] font-semibold text-ink">Nothing started yet.</p>
                  <p className="text-[14px] text-ink-3">Your last lesson will show up here.</p>
                </div>
                <Button href="/paths" className="self-start sm:self-auto">Browse paths</Button>
              </>
            )}
          </div>
        </Section>

        <Section title="Your paths" id="d-paths">
          <ul className="flex flex-col gap-3">
            {PATHS.map((path) => {
              const slugs = pathLessons(path.id).map((l) => l.slug);
              const done = slugs.filter((s) => completed.has(s)).length;
              const next = slugs.find((s) => !completed.has(s));
              const percent = slugs.length ? Math.round((done / slugs.length) * 100) : 0;
              return (
                <li key={path.id} className={cn(card, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6')}>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/paths/${path.id}`}
                      className={cn('rounded-cell text-[16px] font-semibold text-ink hover:text-coral-ink hover:underline underline-offset-4', focusRing)}
                    >
                      {path.title}
                    </Link>
                    <ProgressBar percent={percent} className="mt-2" />
                    <p className="mt-1.5 text-[13px] tabular-nums text-ink-3">
                      {done} of {slugs.length} done
                    </p>
                  </div>
                  <Button
                    href={`/learn/${next ?? slugs[0]}`}
                    variant={next ? 'primary' : 'secondary'}
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    {!next ? 'Review' : done > 0 ? 'Continue' : 'Start'}
                    <span className="sr-only"> {path.title}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Recently completed" id="d-recent">
          {recent.length === 0 ? (
            <p className="text-[15px] text-ink-2">No lessons completed yet. Finish one and it will show up here.</p>
          ) : (
            <ul className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-paper-raised">
              {recent.map((slug) => {
                const lesson = getLessonMeta(slug)!;
                return (
                  <li key={slug}>
                    <Link
                      href={`/learn/${slug}`}
                      className={cn('flex min-h-[56px] items-center justify-between gap-4 px-4 py-3 hover:bg-paper-sunken sm:px-5', focusRing)}
                    >
                      <span className="text-[16px] font-semibold text-ink">{lesson.title}</span>
                      <span className="shrink-0 text-[13px] text-ink-3">{placeOf(slug)?.path.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Practice" id="d-practice">
            <div className={card}>
              <p className="text-[28px] font-semibold leading-9 tabular-nums text-ink">{solved}</p>
              <p className="text-[14px] text-ink-3">{solved === 1 ? 'problem' : 'problems'} marked solved</p>
              <Link href="/practice" className={cn('mt-4 inline-flex min-h-[40px] items-center rounded-cell text-[15px] font-semibold text-coral-ink underline underline-offset-4', focusRing)}>
                Go to Practice
              </Link>
            </div>
          </Section>

          <Section title="Pattern gym" id="d-gym">
            <div className={card}>
              {gym ? (
                <>
                  <p className="text-[28px] font-semibold leading-9 tabular-nums text-ink">{gym.bestScore}%</p>
                  <p className="text-[14px] text-ink-3">
                    best score · {gym.attempts} {gym.attempts === 1 ? 'attempt' : 'attempts'}
                  </p>
                </>
              ) : (
                <p className="text-[15px] leading-6 text-ink-2">No gym sessions yet. Spot the pattern in a problem, fast.</p>
              )}
              <Link href="/gym" className={cn('mt-4 inline-flex min-h-[40px] items-center rounded-cell text-[15px] font-semibold text-coral-ink underline underline-offset-4', focusRing)}>
                Open the Pattern gym
              </Link>
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-14 border-t border-rule pt-6">
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          Reset progress
        </Button>
      </div>

      {confirming ? (
        <ResetDialog
          onClose={closeConfirm}
          onConfirm={() => {
            resetAllProgress();
            setConfirming(false);
          }}
        />
      ) : null}
    </>
  );
}
