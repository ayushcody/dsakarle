'use client';
import React, { useEffect, useState } from 'react';

// Using simple intersection observer pattern for scrollspy if desired,
// but for now we just show a static progress checklist.
export default function Sidebar() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const links = [
    { id: 'overview', label: 'Overview' },
    { id: 'theory', label: 'The Intuition' },
    { id: 'stepper', label: 'Interactive Stepper' },
    { id: 'examples', label: 'Walkthrough Examples' },
    { id: 'quizzes', label: 'Knowledge Check' },
    { id: 'practice', label: 'Practice Bank' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Find the current section
      const sections = links.map(l => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
      let currentId = 'overview';
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = section.id;
        }
      }
      setActiveSection(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sticky top-24 w-64 hidden xl:block shrink-0 h-[calc(100vh-120px)] overflow-y-auto pr-6 pb-12 scrolbar-hide">
      
      <div className="mb-8">
        <h4 className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4">Topic Progress</h4>
        <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-[var(--accent-coral)] rounded-full" style={{ width: '45%' }}></div>
        </div>
        <div className="flex justify-between font-dmmono text-xs text-[var(--text-secondary)]">
          <span>In Progress</span>
          <span className="font-bold text-[var(--accent-coral)]">45%</span>
        </div>
      </div>

      <nav>
        <h4 className="font-dmmono text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4">On this page</h4>
        <ul className="space-y-3 relative border-l-2 border-[var(--bg-secondary)] pb-2">
          {links.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <li key={link.id} className="relative">
                {isActive && (
                  <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-[var(--accent-coral)] z-10 rounded-full"></div>
                )}
                <a 
                  href={`#${link.id}`} 
                  className={`pl-4 block text-sm font-dmsans transition-colors py-1 ${isActive ? 'text-[var(--accent-coral)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-10 p-5 bg-[#FAF9F7] rounded-[var(--radius-sm)] border border-[var(--border)]">
        <h4 className="font-dmsans font-bold text-[var(--text-primary)] text-sm mb-2">Need help?</h4>
        <p className="font-dmsans text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
          Join our Discord community to ask questions and discuss solutions.
        </p>
        <button className="w-full bg-white border border-[#D4D4D4] hover:border-[var(--text-primary)] hover:bg-[#FAFAFA] text-[var(--text-primary)] text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Discord
        </button>
      </div>
    </div>
  );
}
