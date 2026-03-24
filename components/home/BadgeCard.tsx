import Link from 'next/link';
import React from 'react';

interface BadgeCardProps {
  title: string;
  slug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  BadgeComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function BadgeCard({ title, slug, difficulty, BadgeComponent }: BadgeCardProps) {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner': return 'badge-pill badge-pill-teal';
      case 'intermediate': return 'badge-pill badge-pill-amber';
      case 'advanced': return 'badge-pill badge-pill-coral';
      default: return 'badge-pill';
    }
  };

  return (
    <Link 
      href={`/learn/${slug}`}
      className="group flex flex-col items-center gap-[12px] rounded-[var(--radius)] border border-[var(--border)] bg-white p-[28px_20px] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="transition-transform duration-200 group-hover:rotate-3">
        <BadgeComponent />
      </div>
      <h3 className="font-dmsans font-medium text-[var(--text-primary)] text-center text-[15px] leading-tight mt-2">{title}</h3>
      <span className={getDifficultyColor()}>
        {difficulty}
      </span>
    </Link>
  );
}
