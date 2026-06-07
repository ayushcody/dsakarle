import React from 'react';
import Link from 'next/link';

interface TopicBadgeProps {
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  href: string;
  icon: React.ReactNode;
}

export default function TopicBadge({ title, difficulty, href, icon }: TopicBadgeProps) {
  const diffColors = {
    BEGINNER: 'text-[var(--state-success)]',
    INTERMEDIATE: 'text-[var(--state-warning)]',
    ADVANCED: 'text-[var(--text-muted)]',
  };

  return (
    <Link href={href} className="group block">
      <div className="flex flex-col items-center justify-center p-6 bg-[var(--white)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="w-16 h-16 rounded-full border border-dashed border-[var(--border-strong)] flex items-center justify-center mb-4 bg-[var(--bg-secondary)] group-hover:bg-[var(--surface-highlight)] transition-colors">
          {icon}
        </div>
        <h4 className="font-dmsans font-semibold text-[var(--text-primary)] text-center text-sm md:text-base mb-2">
          {title}
        </h4>
        <span className={`font-dmsans text-xs font-bold tracking-widest ${diffColors[difficulty]}`}>
          {difficulty}
        </span>
      </div>
    </Link>
  );
}
