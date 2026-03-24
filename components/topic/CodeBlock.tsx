import React from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="bg-[var(--bg-dark)] rounded-[var(--radius)] overflow-hidden my-6 shadow-sm">
      <div className="bg-[#262626] border-b border-[#404040] py-2 px-4 flex justify-between items-center">
        <span className="font-dmmono text-xs text-[#A3A3A3] uppercase tracking-widest">{language}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-dmmono text-sm leading-relaxed text-[#A3A3A3]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
