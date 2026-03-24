'use client';
import React, { useEffect, useRef } from 'react';
import { useStepperStore } from './useStepperStore';
import ArrayDiagram from '../diagrams/ArrayDiagram';
import VariableStatePanel from './VariableStatePanel';
import ConstraintGauge from './ConstraintGauge';
import { Step, Language } from '@/types';

interface StepperBlockProps {
  steps: Step[];
  codeHtml: Record<Language, string>;
  diagramType: 'array' | 'linked-list' | 'tree' | 'graph';
  arrayCells?: number[];
  constraintLabel?: string;
}

export default function StepperBlock({ steps, codeHtml, diagramType, arrayCells, constraintLabel }: StepperBlockProps) {
  const { currentStep, initSteps, setStep, nextStep, prevStep, selectedLanguage } = useStepperStore();

  useEffect(() => {
    initSteps(steps.length);
  }, [steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[currentStep] || steps[0];
  const codeRef = useRef<HTMLDivElement>(null);

  // Sync active line
  useEffect(() => {
    if (!codeRef.current || !step) return;
    
    // Clear previous active lines
    const previousActives = codeRef.current.querySelectorAll('.active-line');
    previousActives.forEach(el => el.classList.remove('active-line'));
    
    // Set new active line
    const activeLineEl = codeRef.current.querySelector(`[data-line="${step.activeLine}"]`);
    if (activeLineEl) {
      activeLineEl.classList.add('active-line');
      activeLineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep, step, selectedLanguage]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep]);

  if (!step) return null;

  return (
    <div className="flex flex-col gap-6 w-full my-12">
      {/* Top: Diagram */}
      <div className="bg-white border w-full text-center border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm min-h-[220px] flex items-center justify-center">
        {diagramType === 'array' && arrayCells && (
           <ArrayDiagram cells={arrayCells} diagramState={step.diagramState} />
        )}
      </div>

      {/* Constraints if present */}
      {step.constraintValue !== undefined && step.constraintMax !== undefined && (
        <div className="flex justify-center -mt-8 relative z-10 bg-white p-3 rounded-xl border border-[var(--border)] mx-auto w-fit shadow-sm">
          <ConstraintGauge value={step.constraintValue} max={step.constraintMax} label={constraintLabel} />
        </div>
      )}

      {/* Middle: Variable Panel */}
      <VariableStatePanel variables={step.variables} />

      {/* Bottom: Code & Slider */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Code Panel */}
        <div className="flex max-h-[400px] flex-1 flex-col overflow-hidden rounded-[var(--radius)] bg-[var(--bg-dark)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-strong)] bg-[var(--bg-dark-secondary)] px-4 py-2">
             <span className="font-dmmono text-xs uppercase tracking-widest text-[var(--text-inverse-muted)]">{selectedLanguage} Implementation</span>
          </div>
          <div 
             ref={codeRef}
             className="p-4 overflow-y-auto font-dmmono text-[13px] leading-relaxed code-container"
             dangerouslySetInnerHTML={{ __html: codeHtml[selectedLanguage] || '' }}
          />
        </div>
        
        {/* Controls Panel */}
        <div className="lg:w-[360px] flex flex-col flex-shrink-0 bg-white border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm">
          <h4 className="font-dmsans font-semibold text-[var(--text-primary)] mb-3">Explanation</h4>
          <p className="font-dmsans text-[var(--text-secondary)] text-[15px] min-h-[80px] leading-relaxed">
            {step.explanation}
          </p>
          
          <div className="mt-8 flex flex-col items-center">
            <input 
              type="range" 
              min={0} 
              max={steps.length > 0 ? steps.length - 1 : 0} 
              value={currentStep}
              onChange={(e) => setStep(parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--border)] accent-[var(--accent-coral)] outline-none focus:ring-2 focus:ring-[var(--accent-coral)]"
            />
            <div className="flex w-full justify-between items-center mt-4 font-dmmono text-xs text-[var(--text-muted)]">
              <button onClick={prevStep} disabled={currentStep === 0} className="p-2 -ml-2 hover:text-[var(--accent-coral)] disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors">&larr; Prev</button>
              <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
              <button onClick={nextStep} disabled={currentStep === steps.length - 1} className="p-2 -mr-2 hover:text-[var(--accent-coral)] disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors">Next &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
