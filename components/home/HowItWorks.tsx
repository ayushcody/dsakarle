import type { ReactNode } from 'react';

import { Reveal } from './Reveal';

/* Tiny sketches, drawn with tokens only. 96 x 64 viewBox, decorative. */
const box = 'fill-paper-raised stroke-rule-strong';
const ink = 'fill-ink-2 font-mono';

function Sketch({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 96 64" className="h-auto w-full max-w-[9.5rem]" fill="none" strokeWidth={1.4} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function Cells({ y = 30, labels }: { y?: number; labels: string[] }) {
  return (
    <>
      {labels.map((label, i) => (
        <g key={i}>
          <rect x={6 + i * 14} y={y} width={13} height={16} rx={3} className={box} />
          <text x={12.5 + i * 14} y={y + 11} textAnchor="middle" fontSize={8} className={ink}>
            {label}
          </text>
        </g>
      ))}
    </>
  );
}

const PILLARS: { id: string; title: string; text: string; art: ReactNode }[] = [
  {
    id: 'watch',
    title: 'Watch',
    text: 'Step through real algorithms one move at a time, with a plain sentence for every step.',
    art: (
      <Sketch>
        <rect x={5} y={26} width={43} height={24} rx={4} className="fill-coral-wash stroke-coral" strokeLinecap="round" />
        <Cells y={30} labels={['2', '1', '5', '1', '3', '2']} />
        <path d="M70 12 L82 12 M78 8 L82 12 L78 16" className="stroke-ink-3" strokeLinecap="round" strokeLinejoin="round" />
      </Sketch>
    ),
  },
  {
    id: 'predict',
    title: 'Predict',
    text: 'Guess the next move before it plays and get instant feedback. A wrong guess teaches you the rule.',
    art: (
      <Sketch>
        <Cells y={8} labels={['2', '1', '5', '1', '3', '2']} />
        <text x={60} y={40} fontSize={16} textAnchor="middle" className="fill-coral-ink font-mono">
          ?
        </text>
        <rect x={8} y={44} width={34} height={14} rx={7} className={box} />
        <rect x={50} y={44} width={34} height={14} rx={7} className="fill-coral-wash stroke-coral" />
      </Sketch>
    ),
  },
  {
    id: 'practice',
    title: 'Practice',
    text: 'Try your own input and watch the same algorithm run on it. Then take on real LeetCode problems.',
    art: (
      <Sketch>
        <rect x={6} y={12} width={84} height={20} rx={5} className="fill-paper-sunken stroke-rule-strong" />
        <text x={12} y={25.5} fontSize={9} className={ink}>
          [4, 9, 2, 7]
        </text>
        <line x1={67} y1={17} x2={67} y2={27} className="stroke-coral" strokeWidth={1.6} strokeLinecap="round" />
        <rect x={50} y={40} width={36} height={16} rx={5} className="fill-coral stroke-none" />
        <path d="M63 44 L63 52 L70 48 Z" className="fill-paper stroke-none" />
      </Sketch>
    ),
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-t border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal>
          <h2 id="how-title" className="t-h1 max-w-[26ch] text-ink">
            How it works
          </h2>
          <p className="t-body mt-3 max-w-[40rem] text-ink-2">Every lesson follows the same three moves.</p>
        </Reveal>

        <Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-4 rounded-card border border-rule bg-paper-raised p-6">
                <div className="flex h-[72px] items-end">{p.art}</div>
                <h3 className="t-h3 flex items-baseline gap-2 text-ink">
                  <span className="font-mono text-[13px] font-medium text-ink-3">{i + 1}</span>
                  {p.title}
                </h3>
                <p className="t-small text-ink-2">{p.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
