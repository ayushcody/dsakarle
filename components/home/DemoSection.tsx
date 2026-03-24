'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const steps = [
  { l: 0, r: 2, sum: 8, max: 8 },
  { l: 1, r: 3, sum: 7, max: 8 },
  { l: 2, r: 4, sum: 9, max: 9 },
  { l: 3, r: 5, sum: 6, max: 9 },
  { l: 4, r: 6, sum: 9, max: 9 },
  { l: 5, r: 7, sum: 7, max: 9 }
];

const array = [2, 1, 5, 1, 3, 2, 4, 1];

function AnimatedValue({ value }: { value: number }) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 400);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`rounded px-2 font-dmmono text-2xl font-bold transition-colors duration-300 ${flash ? 'bg-[var(--state-warning)] text-white' : 'text-white'}`}>
      {value}
    </span>
  );
}

export default function DemoSection() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  return (
    <section className="bg-[var(--bg-dark)] py-24 px-6 w-full overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left Text */}
        <div className="flex-1 text-center lg:text-left">
          <span className="font-dmmono text-[13px] text-[var(--accent-teal)] tracking-widest uppercase mb-4 block font-medium">Live Demo</span>
          <h2 className="font-lora text-3xl md:text-5xl font-bold text-white mb-6">Watch a window slide in real time</h2>
          <p className="mb-8 max-w-lg font-dmsans text-[18px] leading-relaxed text-[var(--text-inverse-muted)] lg:mx-0 mx-auto">
            This isn&apos;t a GIF. Drag the slider and watch the window move, variables update, and the explanation change — all in sync.
          </p>
          <Link href="/learn/sliding-window" className="inline-block bg-[var(--accent-coral)] text-white px-6 py-3 rounded-lg font-dmsans font-medium hover:bg-[var(--accent-coral-dark)] hover:-translate-y-0.5 transition-transform text-center max-w-fit">
            Try Sliding Window &rarr;
          </Link>
        </div>

        {/* Right Widget */}
        <div className="relative flex-1 w-full max-w-lg rounded-xl border border-[var(--border-strong)] bg-[var(--bg-dark-secondary)] p-6 shadow-2xl">
          
          {/* Variables Panel */}
          <div className="mb-10 grid grid-cols-4 gap-4 border-b border-[var(--border-strong)] pb-6">
            <div className="flex flex-col items-center">
              <span className="mb-1 font-dmmono text-xs text-[var(--text-inverse-muted)]">left</span>
              <AnimatedValue value={step.l} />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 font-dmmono text-xs text-[var(--text-inverse-muted)]">right</span>
              <AnimatedValue value={step.r} />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 font-dmmono text-xs text-[var(--text-inverse-muted)]">window_sum</span>
              <AnimatedValue value={step.sum} />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 font-dmmono text-xs text-[var(--text-inverse-muted)]">max_sum</span>
              <AnimatedValue value={step.max} />
            </div>
          </div>

          {/* Array Diagram */}
          <div className="relative h-[80px] flex items-center justify-center gap-[4px] sm:gap-[8px] mb-12">
            {array.map((val, idx) => {
              const inWindow = idx >= step.l && idx <= step.r;
              return (
                <div key={idx} className="relative">
                  {/* Left Pointer */}
                  {idx === step.l && (
                    <div className="pointer-bounce absolute -bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center">
                      <div className="h-0 w-0 rotate-180 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-[var(--pointer-left)]"></div>
                      <span className="mt-1 font-dmmono text-xs font-bold text-[var(--pointer-left)]">L</span>
                    </div>
                  )}
                  {/* Right Pointer */}
                  {idx === step.r && (
                    <div className="pointer-bounce absolute -bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center">
                      <div className="h-0 w-0 rotate-180 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-[var(--pointer-right)]"></div>
                      <span className="mt-1 font-dmmono text-xs font-bold text-[var(--pointer-right)]">R</span>
                    </div>
                  )}

                  {/* Cell */}
                  <div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-dmmono text-lg font-bold rounded ${
                      inWindow 
                        ? 'border-2 border-[var(--accent-coral)] bg-[var(--surface-highlight)] text-[var(--accent-amber)]' 
                        : 'border border-[var(--text-inverse-subtle)] bg-[var(--bg-dark-tertiary)] text-[var(--text-inverse-muted)]'
                    } transition-colors duration-200`}
                  >
                    {val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slider */}
          <div className="flex flex-col items-center">
            <input 
              type="range" 
              min={0} 
              max={5} 
              step={1} 
              value={stepIndex}
              onChange={(e) => setStepIndex(parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--border-strong)] accent-[var(--accent-coral)]"
            />
            <p className="mt-4 h-5 text-center font-dmsans text-sm text-[var(--text-inverse-muted)]">
              {stepIndex === 0 && "Initial window of size k=3."}
              {stepIndex > 0 && "Slide window right: subtract left element, add right element."}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
