'use client'

import { focusRing } from '@/components/ui/cn'

import { useLessonReading } from './LessonShell'

/** A slim, dismissible "pick up where you left off" bar. It only links; it never scrolls on its own. */
export function ResumeBar() {
  const { resume, dismissResume } = useLessonReading()
  if (!resume) return null
  return (
    <div
      role="region"
      aria-label="Resume reading"
      className="mx-auto mt-6 flex max-w-[720px] items-center gap-3 rounded-card border border-rule bg-paper-raised px-4 py-2 text-[14px] text-ink-2"
    >
      <p className="m-0 min-w-0 flex-1">
        Pick up where you left off — <span className="font-semibold text-ink">{resume.label}</span>
      </p>
      <a
        href={`#${resume.id}`}
        onClick={dismissResume}
        className={`inline-flex min-h-[40px] items-center rounded-cell font-semibold text-coral-ink underline underline-offset-4 ${focusRing}`}
      >
        Continue
      </a>
      <button
        type="button"
        onClick={dismissResume}
        aria-label="Dismiss"
        className={`-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-cell text-ink-3 hover:text-ink ${focusRing}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
