'use client';
import React, { useState } from 'react';

interface ConceptQuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function ConceptQuiz({ question, options, correctIndex, explanation }: ConceptQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleSubmit = () => {
    if (selectedIndex !== null) setIsRevealed(true);
  };

  return (
    <div className="bg-white rounded-[var(--radius)] p-6 md:p-8 border border-[var(--border)] my-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
         <span className="font-dmmono uppercase tracking-widest text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded">Knowledge Check</span>
      </div>
      <h3 className="font-dmsans font-bold text-lg md:text-xl text-[var(--text-primary)] mb-6 leading-relaxed">
        {question}
      </h3>
      
      <div className="space-y-3 mb-8">
        {options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === correctIndex;
          
          let styles = "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--text-muted)] cursor-pointer";
          
          if (isRevealed) {
            if (isCorrect) {
              styles = "border-[#16A34A] bg-[#16A34A0A] text-[#16A34A] cursor-default font-medium";
            } else if (isSelected && !isCorrect) {
              styles = "border-[#DC2626] bg-[#DC26260A] text-[#DC2626] cursor-default";
            } else {
              styles = "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] opacity-60 cursor-default";
            }
          } else if (isSelected) {
            styles = "border-[var(--text-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium";
          }

          return (
            <div 
              key={i}
              onClick={() => !isRevealed && setSelectedIndex(i)}
              className={`flex items-start gap-4 p-4 rounded-[var(--radius-sm)] border transition-all duration-200 ${styles}`}
            >
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                isRevealed && isCorrect ? 'border-[#16A34A] bg-[#16A34A]' :
                isRevealed && isSelected && !isCorrect ? 'border-[#DC2626] bg-[#DC2626]' :
                isSelected ? 'border-[var(--text-primary)] border-[5px]' :
                'border-[#A3A3A3]'
              }`}>
                {isRevealed && (isCorrect || isSelected) && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {isCorrect ? <polyline points="20 6 9 17 4 12" /> : (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    )}
                  </svg>
                )}
              </div>
              <span className="font-dmsans text-[15px] pt-0.5 leading-snug">{opt}</span>
            </div>
          );
        })}
      </div>

      {!isRevealed ? (
        <button 
          onClick={handleSubmit}
          disabled={selectedIndex === null}
          className="bg-[var(--text-primary)] text-white px-6 py-2.5 rounded hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-dmsans font-medium text-sm w-full sm:w-auto"
        >
          Check Answer
        </button>
      ) : (
        <div className="bg-[var(--bg-secondary)] p-5 rounded-[var(--radius-sm)] border border-[var(--border)] animate-in fade-in slide-in-from-bottom-2">
          <h4 className="font-dmsans font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-teal)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Explanation
          </h4>
          <p className="font-dmsans text-[15px] text-[var(--text-secondary)] leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
