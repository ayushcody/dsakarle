'use client';

import { useEffect, useRef } from 'react';

import { useStepperStore } from '@/lib/stepper-store';
import type { CodeLanguage, StepperStep } from '@/types/learning';

interface CodeTabsProps {
  code: Record<CodeLanguage, string>
  renderedCode: Record<CodeLanguage, string>
  activeLine?: number
  steps?: StepperStep[]
}

const TABS: CodeLanguage[] = ['python', 'javascript', 'java', 'cpp'];
const TAB_LABELS: Record<CodeLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

export function CodeTabs({ renderedCode, activeLine, steps }: CodeTabsProps) {
  const { selectedLanguage, setLanguage, currentStep, setStep } = useStepperStore();
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!codeRef.current) {
      return;
    }

    const lines = Array.from(codeRef.current.querySelectorAll('[data-line]'));
    
    // Setup clickability once per language change
    if (steps) {
      const validLines = new Set(steps.map(s => s.activeLine).filter(l => l !== undefined));
      for (const line of lines) {
        const lineNum = parseInt(line.getAttribute('data-line') || '0', 10);
        if (validLines.has(lineNum)) {
          line.classList.add('clickable-line');
          line.setAttribute('title', 'Click to jump to this step');
        } else {
          line.classList.remove('clickable-line');
          line.removeAttribute('title');
        }
      }
    }

    for (const line of lines) {
      line.classList.remove('active-line');
    }

    if (activeLine === undefined) {
      return;
    }

    const targetLine = codeRef.current.querySelector(`[data-line="${activeLine}"]`);
    targetLine?.classList.add('active-line');
    targetLine?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeLine, currentStep, selectedLanguage, steps]);

  const handleCodeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const lineElement = target.closest('[data-line]');
    if (lineElement && steps) {
      const lineNum = parseInt(lineElement.getAttribute('data-line') || '0', 10);
      const targetStepIndex = steps.findIndex(step => step.activeLine === lineNum);
      if (targetStepIndex !== -1) {
        setStep(targetStepIndex);
      }
    }
  };

  return (
    <div>
      <style>{`
        .clickable-line {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .clickable-line:hover {
          background: rgba(200, 144, 10, 0.1) !important;
        }
      `}</style>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 13,
              background: selectedLanguage === lang ? 'var(--accent-coral)' : 'transparent',
              color: selectedLanguage === lang ? 'white' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              borderBottom:
                selectedLanguage === lang
                  ? '2px solid var(--accent-coral)'
                  : '2px solid transparent',
            }}
          >
            {TAB_LABELS[lang]}
          </button>
        ))}
      </div>

      <div
        ref={codeRef}
        onClick={handleCodeClick}
        style={{
          overflow: 'auto',
          maxHeight: '400px',
          background: '#F5F2ED',
          padding: '16px',
          borderRadius: '0 0 8px 8px',
        }}
        dangerouslySetInnerHTML={{ __html: renderedCode[selectedLanguage] }}
      />
    </div>
  );
}

export default CodeTabs;
