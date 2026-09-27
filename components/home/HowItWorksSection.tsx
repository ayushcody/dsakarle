'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

function MiniRoad() {
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
      <path d="M 20 90 C 60 90, 60 30, 100 30 S 150 80, 185 40" fill="none" stroke="#D4C5B5" strokeWidth="14" strokeLinecap="round" />
      <path d="M 20 90 C 60 90, 60 30, 100 30 S 150 80, 185 40" fill="none" stroke="#FFFDF9" strokeWidth="1.5" strokeDasharray="8 7" />
      {[[20, 90, true], [100, 30, true], [185, 40, false]].map(([x, y, d], i) => (
        <g key={i}>
          <circle cx={x as number} cy={y as number} r="13" fill="var(--white)" stroke={d ? '#D99B26' : 'var(--border-strong)'} strokeWidth="3" />
          <circle cx={x as number} cy={y as number} r="4" fill={d ? '#D99B26' : 'var(--accent-coral)'} />
        </g>
      ))}
    </svg>
  );
}

function MiniStepper({ play }: { play: boolean }) {
  const cells = [2, 7, 11, 15, 19];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setI((v) => (v + 1) % cells.length), 900);
    return () => clearInterval(t);
  }, [play, cells.length]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="flex gap-1.5">
        {cells.map((c, k) => (
          <motion.div
            key={k}
            animate={{ backgroundColor: k === i ? '#D99B26' : 'var(--white)', color: k === i ? '#fff' : 'var(--text-primary)', y: k === i ? -4 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-strong)] font-dmmono text-sm font-bold"
          >
            {c}
          </motion.div>
        ))}
      </div>
      <div className="relative h-4 w-[216px]">
        <motion.span animate={{ x: i * 42 + 14 }} transition={{ duration: 0.3, ease: EASE }} className="absolute font-dmmono text-xs font-bold text-[var(--accent-amber)]">↑ i</motion.span>
      </div>
    </div>
  );
}

function MiniQuiz() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-2">
      {['Sliding Window', 'Two Pointers', 'Binary Search'].map((o, k) => (
        <div key={o} className={`rounded-md border px-3 py-1.5 font-dmsans text-xs font-bold ${k === 1 ? 'border-[var(--accent-teal)] bg-[var(--surface-teal)] text-[var(--accent-teal)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
          {k === 1 ? '✓ ' : ''}{o}
        </div>
      ))}
    </div>
  );
}

function MiniProblem() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-2">
      <p className="font-dmsans text-sm font-bold text-[var(--text-primary)]">Container With Most Water</p>
      <div className="flex items-center justify-between">
        <span className="rounded-sm bg-[var(--surface-amber)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-amber)]">medium</span>
        <span className="rounded-full bg-[var(--accent-coral)] px-4 py-1.5 font-dmsans text-xs font-bold text-white">Solve</span>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });

  const steps = [
    { title: 'Pick a topic', body: 'Follow the roadmap from arrays to dynamic programming, one checkpoint at a time.', preview: <MiniRoad /> },
    { title: 'Watch it run', body: 'Scrub through every step and see pointers, windows, and tables change live.', preview: <MiniStepper play={inView} /> },
    { title: 'Name the pattern', body: 'Quizzes train you to spot which pattern a problem wants before you write code.', preview: <MiniQuiz /> },
    { title: 'Solve for real', body: 'Curated LeetCode problems per topic, with hints that nudge instead of spoil.', preview: <MiniProblem /> },
  ];

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="mb-4 font-dmsans text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl text-balance">Intuition first, code second</h2>
          <p className="font-dmsans text-lg text-[var(--text-secondary)]">Four moves, repeated for every topic, until patterns feel obvious.</p>
        </div>

        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, k) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: EASE, delay: k * 0.12 }}
              className="relative"
            >
              <div className="mb-5 h-[140px] rounded-[16px] border border-[var(--border)] bg-[var(--bg-primary)] p-3">{s.preview}</div>
              <h3 className="mb-2 font-dmsans text-xl font-bold text-[var(--text-primary)]">{s.title}</h3>
              <p className="font-dmsans leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
