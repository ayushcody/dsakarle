'use client';

import { useEffect, useRef } from 'react';

import { useStepperStore } from '@/lib/stepper-store';
import type { CodeLanguage } from '@/types/learning';

interface CodeTabsProps {
  code: Record<CodeLanguage, string>
  renderedCode: Record<CodeLanguage, string>
  activeLine?: number
}

const TABS: CodeLanguage[] = ['python', 'javascript', 'java', 'cpp'];
const TAB_LABELS: Record<CodeLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

export function CodeTabs({ renderedCode, activeLine }: CodeTabsProps) {
  const { selectedLanguage, setLanguage, currentStep } = useStepperStore();
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!codeRef.current) {
      return;
    }

    const lines = Array.from(codeRef.current.querySelectorAll('[data-line]'));
    for (const line of lines) {
      line.classList.remove('active-line');
    }

    if (activeLine === undefined) {
      return;
    }

    const targetLine = codeRef.current.querySelector(`[data-line="${activeLine}"]`);
    targetLine?.classList.add('active-line');
    targetLine?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeLine, currentStep, selectedLanguage]);

  return (
    <div>
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
