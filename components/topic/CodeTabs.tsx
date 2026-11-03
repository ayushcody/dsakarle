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

export function CodeTabs({ code, renderedCode, activeLine, steps }: CodeTabsProps) {
  const { selectedLanguage, setLanguage, currentStep, setStep } = useStepperStore();
  const codeRef = useRef<HTMLDivElement>(null);

  // Only offer languages that actually have source code.
  const availableTabs = TABS.filter((lang) => Boolean(code?.[lang]?.trim()));
  const activeLanguage = availableTabs.includes(selectedLanguage) ? selectedLanguage : availableTabs[0];

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

    // Scroll only the code container (scrollIntoView can also scroll the whole page).
    if (targetLine instanceof HTMLElement) {
      const container = codeRef.current;
      const lineTop =
        targetLine.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      const lineBottom = lineTop + targetLine.offsetHeight;
      if (lineTop < container.scrollTop || lineBottom > container.scrollTop + container.clientHeight) {
        container.scrollTo({
          top: Math.max(0, lineTop - container.clientHeight / 2 + targetLine.offsetHeight / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [activeLine, currentStep, activeLanguage, steps]);

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

  if (!activeLanguage) {
    return null;
  }

  return (
    <div>
      <style>{`
        .clickable-line {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .clickable-line:hover {
          background: var(--surface-amber) !important;
        }
      `}</style>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {availableTabs.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 13,
              background: activeLanguage === lang ? 'var(--accent-coral)' : 'transparent',
              color: activeLanguage === lang ? 'var(--paper-raised)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              borderBottom:
                activeLanguage === lang
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
          background: 'var(--paper-sunken)',
          padding: '16px',
          borderRadius: '0 0 8px 8px',
        }}
        dangerouslySetInnerHTML={{ __html: renderedCode[activeLanguage] }}
      />
    </div>
  );
}

export default CodeTabs;
