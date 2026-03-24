'use client';
import React, { useState } from 'react';
import { Language } from '@/types';

interface CodeTabsProps {
  code: Record<Language, string>;
}

export default function CodeTabs({ code }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState<Language>('python');
  
  const tabs: {id: Language, label: string}[] = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' }
  ];

  return (
    <div className="bg-[var(--bg-dark)] rounded-[var(--radius)] overflow-hidden shadow-sm border border-[#404040]">
      <div className="flex bg-[#262626] border-b border-[#404040] overflow-x-auto scrolbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-dmmono text-[11px] tracking-widest uppercase transition-colors whitespace-nowrap outline-none ${
              activeTab === tab.id 
                ? 'bg-[#171717] text-[var(--accent-coral)] border-t-[3px] border-t-[var(--accent-coral)] pt-[9px]' 
                : 'text-[#A3A3A3] hover:bg-[#333333] hover:text-[#D4D4D4] border-t-[3px] border-t-transparent pt-[9px]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 bg-[#171717] overflow-x-auto">
        <pre className="font-dmmono text-[13px] leading-relaxed text-[#D4D4D4]">
          <code>{code[activeTab] || 'Code coming soon...'}</code>
        </pre>
      </div>
    </div>
  );
}
