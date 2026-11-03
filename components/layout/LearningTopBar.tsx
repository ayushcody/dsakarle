'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useNavStore } from '@/lib/nav-store';

const NAV_ITEMS = [
  { label: 'Learn', href: '/learn', hideOnMobile: false },
  { label: 'Practice', href: '/practice', hideOnMobile: true },
  { label: 'Curriculum', href: '/map', hideOnMobile: true },
  { label: 'About', href: '/about', hideOnMobile: true },
];

export function LearningTopBar() {
  const pathname = usePathname() ?? '';
  const mobileNavOpen = useNavStore((state) => state.mobileNavOpen);
  const toggleMobileNav = useNavStore((state) => state.toggleMobileNav);

  // The lesson sidebar only exists on topic pages (/learn/[slug]); the /learn index has none.
  const hasSidebar = pathname.startsWith('/learn/');

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`h-[64px] fixed top-0 right-0 left-0 ${hasSidebar ? 'md:left-[280px]' : ''} bg-white border-b border-[var(--border)] z-40 flex items-center px-6 transition-all duration-300`}
    >
      <div className="flex items-center gap-6">
        {hasSidebar && (
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? 'Close lesson menu' : 'Open lesson menu'}
            aria-expanded={mobileNavOpen}
            aria-controls="lesson-sidebar"
            className="md:hidden -ml-2 p-2 text-[var(--text-primary)]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`${item.hideOnMobile ? 'hidden md:block ' : ''}font-dmsans text-[14px] transition-colors ${
              isActive(item.href)
                ? 'text-[var(--accent-coral)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto"><ThemeToggle /></div>{/* TEMP: Phase 4 moves this into the navbar */}
    </header>
  );
}
