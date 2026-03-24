import React from 'react';

interface TheoryBlockProps {
  content: string;
}

export default function TheoryBlock({ content }: TheoryBlockProps) {
  // Simple bolding of key terms for demonstration
  // In a real app we'd use a markdown parser here.
  const parsedContent = content.split(/(\*\*.*?\*\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <div className="prose prose-lg max-w-none font-dmsans text-[var(--text-secondary)] leading-relaxed mb-6">
      <p>{parsedContent}</p>
    </div>
  );
}
