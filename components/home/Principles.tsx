'use client';

import { Legend } from '@/components/stage/primitives/Legend';

import { Reveal } from './Reveal';

const PRINCIPLES = [
  {
    title: 'Picture before code',
    text: 'Each lesson opens with a drawing of the shape and a question you cannot answer yet. Syntax comes last.',
  },
  {
    title: 'Predict, don’t just read',
    text: 'The walkthrough stops and asks what happens next. Guessing, even wrongly, is what makes the rule stick.',
  },
  {
    title: 'Same colour, same meaning',
    text: 'A colour never changes its job from one lesson to the next, and each one has a shape cue too, so you never rely on colour alone.',
  },
] as const;

export function Principles() {
  return (
    <section aria-labelledby="idea-title" className="border-y border-rule bg-paper-sunken">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal>
          <p className="t-eyebrow">The one idea</p>
          <h2 id="idea-title" className="t-h1 mt-3 max-w-[24ch] text-ink">
            You learn an algorithm by watching it make decisions.
          </h2>
        </Reveal>

        <Reveal>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="flex flex-col gap-2 border-t border-rule-strong pt-4">
                <span className="font-mono text-[13px] font-medium text-ink-3">{i + 1}</span>
                <h3 className="t-h3 text-ink">{p.title}</h3>
                <p className="t-small text-ink-2">{p.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-card border border-rule bg-paper-raised p-5 shadow-1 sm:p-6">
            <p className="t-caption mb-3 text-ink-2">The colour language, the same in every lesson</p>
            <Legend roles={['ptrA', 'ptrB', 'focus', 'compare', 'found']} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
