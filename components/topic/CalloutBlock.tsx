import React from 'react';

interface CalloutBlockProps {
  type: 'note' | 'tip' | 'warning' | 'interview';
  title: string;
  content: string;
}

export default function CalloutBlock({ type, title, content }: CalloutBlockProps) {
  let colors = { bg: '', border: '', icon: '', iconFill: '' };
  
  switch(type) {
    case 'tip':
      colors = { bg: 'bg-[var(--surface-teal)]', border: 'border-[var(--accent-teal)]', icon: 'text-[var(--accent-teal)]', iconFill: 'currentColor' };
      break;
    case 'warning':
      colors = { bg: 'bg-[var(--surface-coral)]', border: 'border-[var(--accent-coral)]', icon: 'text-[var(--accent-coral)]', iconFill: 'none' };
      break;
    case 'interview':
      colors = { bg: 'bg-[var(--surface-amber)]', border: 'border-[var(--accent-amber)]', icon: 'text-[var(--accent-amber)]', iconFill: 'none' };
      break;
    case 'note':
    default:
      colors = { bg: 'bg-[var(--bg-secondary)]', border: 'border-[var(--border)]', icon: 'text-[var(--text-secondary)]', iconFill: 'none' };
  }

  return (
    <div className={`my-8 flex gap-4 rounded-[var(--radius-sm)] border-l-4 p-5 ${colors.bg} ${colors.border}`}>
      <div className={`shrink-0 mt-1 ${colors.icon}`}>
        {type === 'interview' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.iconFill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ) : type === 'tip' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.iconFill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.41.56 2.63 1.49 3.49.77.77 1.24 1.54 1.42 2.51" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.iconFill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <div>
        <h4 className={`font-dmsans font-bold mb-1 ${colors.icon}`}>{title}</h4>
        <p className="font-dmsans text-[var(--text-primary)] text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
