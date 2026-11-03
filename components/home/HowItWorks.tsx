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

const STEPS: { id: string; title: string; text: string; art: ReactNode }[] = [
  {
    id: 'picture',
    title: 'Picture',
    text: 'Start with a drawing of the shape and a question, before any code.',
    art: (
      <Sketch>
        <Cells labels={['2', '1', '5', '1', '3', '2']} />
        <path d="M48 8 C 44 14, 40 18, 36 26" className="stroke-coral" strokeLinecap="round" />
        <path d="M33 21 L36 27 L41 23" className="stroke-coral" strokeLinecap="round" strokeLinejoin="round" />
      </Sketch>
    ),
  },
  {
    id: 'watch',
    title: 'Watch',
    text: 'Step through a real run, one move at a time, with a plain sentence for each.',
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
    text: 'It pauses and asks what happens next. A wrong guess teaches you the rule.',
    art: (
      <Sketch>
        <Cells y={8} labels={['2', '1', '5', '1', '3', '2']} />
        <text x={60} y={40} fontSize={16} textAnchor="middle" className="fill-coral-ink font-serif">
          ?
        </text>
        <rect x={8} y={44} width={34} height={14} rx={7} className={box} />
        <rect x={50} y={44} width={34} height={14} rx={7} className="fill-coral-wash stroke-coral" />
      </Sketch>
    ),
  },
  {
    id: 'try',
    title: 'Try',
    text: 'Type your own numbers and watch the same algorithm run on them.',
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
  {
    id: 'code',
    title: 'Code',
    text: 'Then read it in Python, Java or C++, with the line you just watched lit up.',
    art: (
      <Sketch>
        <g fontSize={7} className="font-mono">
          <rect x={6} y={6} width={22} height={11} rx={3} className="fill-coral-wash stroke-coral" />
          <text x={17} y={14} textAnchor="middle" className="fill-coral-ink">Py</text>
          <rect x={31} y={6} width={26} height={11} rx={3} className={box} />
          <text x={44} y={14} textAnchor="middle" className="fill-ink-2">Java</text>
          <rect x={60} y={6} width={26} height={11} rx={3} className={box} />
          <text x={73} y={14} textAnchor="middle" className="fill-ink-2">C++</text>
        </g>
        <rect x={6} y={22} width={84} height={36} rx={4} className="fill-paper-sunken stroke-rule" />
        <rect x={9} y={30} width={78} height={7} rx={2} className="fill-coral-wash" stroke="none" />
        <path d="M13 26 H46 M17 34 H62 M17 42 H54 M13 50 H38" className="stroke-ink-3" strokeLinecap="round" />
      </Sketch>
    ),
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-y border-rule bg-paper-sunken">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal>
          <p className="t-eyebrow">How a lesson works</p>
          <h2 id="how-title" className="t-h1 mt-3 max-w-[26ch] text-ink">
            Five steps, the same every time.
          </h2>
        </Reveal>

        <Reveal>
          <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <li key={step.id} className="relative flex flex-col gap-3">
                <div className="flex items-end">{step.art}</div>
                <h3 className="t-h3 flex items-baseline gap-2 text-ink">
                  <span className="font-mono text-[13px] font-medium text-ink-3">{i + 1}</span>
                  {step.title}
                </h3>
                <p className="t-small text-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
