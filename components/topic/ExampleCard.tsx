'use client';

import { useState } from 'react';

import type { CodeLanguage, WorkedExample } from '@/types/learning';

const LANGUAGES: CodeLanguage[] = ['python', 'javascript', 'java', 'cpp'];

const labels: Record<CodeLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

export function ExampleCard({ example }: { example: WorkedExample }) {
  const [expanded, setExpanded] = useState(false);
  const [language, setLanguage] = useState<CodeLanguage>('python');

  const difficultyClass = {
    easy: 'badge-pill badge-pill-teal',
    medium: 'badge-pill badge-pill-amber',
    hard: 'badge-pill badge-pill-coral',
  }[example.difficulty];

  return (
    <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex items-center gap-4">
          <span className={difficultyClass}>{example.difficulty}</span>
          <div>
            <h3 className="font-dmsans text-lg font-semibold text-[var(--text-primary)]">{example.title}</h3>
            <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {expanded ? 'Collapse' : 'Expand'} →
            </span>
          </div>
        </div>
        <span className={`text-xl text-[var(--text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] bg-white px-5 py-5">
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-4">
            <p className="font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{example.problemStatement}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Input</span>
              <p className="mt-2 font-dmmono text-sm text-[var(--text-primary)]">{example.inputExample}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Output</span>
              <p className="mt-2 font-dmmono text-sm text-[var(--text-primary)]">{example.outputExample}</p>
            </div>
          </div>

          <ol className="mt-5 space-y-3">
            {example.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-coral)] font-dmmono text-xs text-white">
                  {index + 1}
                </span>
                <span className="font-dmsans text-[15px] leading-relaxed text-[var(--text-secondary)]">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
              {LANGUAGES.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-3 py-1.5 font-dmmono text-xs uppercase tracking-[0.08em] ${
                    language === tab
                      ? 'bg-[var(--accent-coral)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                  onClick={() => setLanguage(tab)}
                >
                  {labels[tab]}
                </button>
              ))}
            </div>
            <pre className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--bg-dark)] p-4 font-dmmono text-[13px] leading-relaxed text-white">
              {example.code[language]}
            </pre>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="badge-pill badge-pill-teal">Time {example.timeComplexity}</span>
            <span className="badge-pill badge-pill-amber">Space {example.spaceComplexity}</span>
            {example.rationale && (
              <span className="font-dmsans text-sm text-[var(--text-secondary)]">{example.rationale}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default ExampleCard;
