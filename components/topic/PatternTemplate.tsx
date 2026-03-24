import React from 'react';

interface PatternTemplateProps {
  pseudocode: string;
  whenToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export default function PatternTemplate({ pseudocode, whenToUse, timeComplexity, spaceComplexity }: PatternTemplateProps) {
  return (
    <div className="my-12">
      <h3 className="font-lora text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Pattern Template
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] rounded-[var(--radius)] p-6 border border-[var(--border)]">
          <h4 className="font-dmmono text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">Pseudocode Structure</h4>
          <pre className="font-dmmono text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
            {pseudocode}
          </pre>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[var(--radius)] p-6 border border-[var(--border)] shadow-sm">
            <h4 className="font-dmmono text-xs uppercase tracking-widest text-[var(--accent-coral)] mb-2">When to use</h4>
            <p className="font-dmsans text-[var(--text-primary)] text-sm leading-relaxed">{whenToUse}</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-[var(--radius)] p-4 border border-[var(--border)] shadow-sm">
              <h4 className="font-dmmono text-xs uppercase tracking-widest text-[var(--accent-teal)] mb-1">Time</h4>
              <p className="font-dmsans font-bold text-[var(--text-primary)]">{timeComplexity.split(' ')[0]}</p>
              <p className="font-dmsans text-xs text-[var(--text-muted)] mt-1">{timeComplexity.substring(timeComplexity.indexOf('-') + 1).trim() || "Average case"}</p>
            </div>
            
            <div className="flex-1 bg-white rounded-[var(--radius)] p-4 border border-[var(--border)] shadow-sm">
              <h4 className="font-dmmono text-xs uppercase tracking-widest text-[var(--accent-amber)] mb-1">Space</h4>
              <p className="font-dmsans font-bold text-[var(--text-primary)]">{spaceComplexity.split(' ')[0]}</p>
              <p className="font-dmsans text-xs text-[var(--text-muted)] mt-1">{spaceComplexity.substring(spaceComplexity.indexOf('-') + 1).trim() || "Average case"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
