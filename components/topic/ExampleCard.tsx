'use client';
import React, { useState } from 'react';
import { Example } from '@/types';
import CodeTabs from './CodeTabs';

export default function ExampleCard({ example }: { example: Example }) {
  const [expanded, setExpanded] = useState(false);

  const badgeMap = {
    easy: 'badge-pill badge-pill-teal',
    medium: 'badge-pill badge-pill-amber',
    hard: 'badge-pill badge-pill-coral'
  };

  return (
    <div className={`my-4 overflow-hidden rounded-[var(--radius)] border bg-white shadow-[var(--shadow-card)] transition-all duration-300 ${expanded ? 'border-[var(--accent-coral)] shadow-[var(--shadow-card-hover)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}`}>
      <div 
        className="p-4 md:p-6 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <span className={badgeMap[example.difficulty]}>
            {example.difficulty}
          </span>
          <h3 className="font-dmsans font-bold text-lg text-[var(--text-primary)]">{example.title}</h3>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 border-t border-[var(--border)] bg-[var(--bg-primary)]/50 p-4 pt-0 md:p-6">
          
          <div className="my-6 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-sm)] border-l-4 border-l-[var(--text-muted)] shadow-inner">
            <h4 className="font-dmmono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Problem Statement</h4>
            <p className="font-dmsans text-[var(--text-primary)] text-[15px] leading-relaxed">{example.problemStatement}</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-card)]">
                <span className="font-dmmono text-[10px] uppercase text-[var(--text-muted)] block mb-1">Input</span>
                <code className="font-dmmono text-[13px] text-[var(--text-primary)]">{example.inputExample}</code>
              </div>
              <div className="flex-1 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-card)]">
                <span className="font-dmmono text-[10px] uppercase text-[var(--text-muted)] block mb-1">Output</span>
                <code className="font-dmmono text-[13px] text-[var(--text-primary)]">{example.outputExample}</code>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="font-dmsans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-coral)]">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.43-5.43"/>
              </svg>
              Walkthrough
            </h4>
            <ul className="space-y-3 pl-2">
              {example.steps.map((step, i) => (
                <li key={i} className="flex gap-4 text-[15px] font-dmsans text-[var(--text-secondary)] leading-relaxed items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[var(--accent-coral)] text-white text-[10px] font-bold mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <CodeTabs code={example.code} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-[var(--border)]">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Time</span>
                <span className="font-dmmono text-[15px] font-bold text-[var(--accent-teal)]">{example.timeComplexity}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Space</span>
                <span className="font-dmmono text-[15px] font-bold text-[var(--accent-amber)]">{example.spaceComplexity}</span>
              </div>
            </div>
            
            <a href={example.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--bg-dark)] px-5 py-2.5 font-dmsans text-[14px] font-medium text-white shadow-[var(--shadow-card)] transition-colors hover:bg-black sm:w-auto">
              Solve on LeetCode
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
