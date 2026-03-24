'use client';
import React, { useState } from 'react';

interface RecognitionQuizProps {
  problemStatement: string;
  correctPatternId: string;
  distractors: string[];
  explanation: string;
}

export default function RecognitionQuiz({ problemStatement, correctPatternId, distractors, explanation }: RecognitionQuizProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const patternOptions = [
    { id: 'sliding-window', label: 'Sliding Window', icon: 'M4 4h4v16H4zM16 4h4v16h-4zM10 4h4v16h-4z' },
    { id: 'two-pointers', label: 'Two Pointers', icon: 'M5 12h14M12 5l7 7-7 7' },
    { id: 'binary-search', label: 'Binary Search', icon: 'M12 2v20M2 12h20' },
    { id: 'hash-maps', label: 'Hash Maps', icon: 'M4 4h16v16H4z' },
    { id: 'fast-and-slow-pointers', label: 'Fast & Slow', icon: 'M4 12h8M12 12h8M8 8l4 4-4 4M16 6l4 6-4 6' },
  ];

  const currentOptions = patternOptions.filter(p => p.id === correctPatternId || distractors.includes(p.id));

  const handleSelect = (id: string) => {
    if (isRevealed) return;
    setSelectedMatch(id);
    setIsRevealed(true);
  };

  return (
    <div className="surface-muted my-12 rounded-[var(--radius)] border border-[var(--border)] p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-teal)] text-[var(--accent-teal)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
        <h3 className="font-lora text-xl md:text-2xl font-bold text-[var(--text-primary)]">Pattern Recognition Check</h3>
      </div>
      
      <p className="font-dmsans text-[var(--text-secondary)] text-[15px] leading-relaxed mb-8">
        Read the problem statement below. Which pattern is the most appropriate approach to solve it?
      </p>

      <div className="relative mb-8 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-teal)]"></div>
        <p className="font-dmsans font-medium text-[var(--text-primary)] leading-relaxed italic">
          &quot;{problemStatement}&quot;
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {currentOptions.map(opt => {
          const isSelected = selectedMatch === opt.id;
          const isCorrect = opt.id === correctPatternId;
          
          let stateStyles = 'bg-white border-[var(--border)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent-teal)] hover:shadow-[var(--shadow-card-hover)]';
          
          if (isRevealed) {
            if (isCorrect) {
              stateStyles = 'bg-[var(--surface-success)] border-[var(--state-success)] text-[var(--state-success)] cursor-default';
            } else if (isSelected && !isCorrect) {
              stateStyles = 'bg-[var(--surface-danger)] border-[var(--state-danger)] text-[var(--state-danger)] cursor-default';
            } else {
              stateStyles = 'cursor-default border-[var(--border)] bg-white text-[var(--text-muted)] opacity-50';
            }
          }

          return (
            <button 
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isRevealed}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-[var(--radius-sm)] border p-4 transition-all duration-300 ${stateStyles}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
                <path d={opt.icon} />
              </svg>
              <span className="font-dmsans font-medium text-sm text-center">{opt.label}</span>
              
              {isRevealed && isCorrect && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--state-success)] text-white shadow-[var(--shadow-card)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className={`rounded-[var(--radius-sm)] border-l-4 p-5 ${selectedMatch === correctPatternId ? 'border-l-[var(--state-success)] bg-[var(--surface-success)]' : 'border-l-[var(--state-danger)] bg-[var(--surface-danger)]'}`}>
          <h4 className={`mb-2 font-dmsans font-bold ${selectedMatch === correctPatternId ? 'text-[var(--state-success)]' : 'text-[var(--state-danger)]'}`}>
            {selectedMatch === correctPatternId ? 'Correct!' : 'Not quite.'}
          </h4>
          <p className="font-dmsans text-[15px] text-[var(--text-primary)] leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
