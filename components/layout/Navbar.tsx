'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[64px] bg-[var(--bg-primary)] border-b border-[var(--border)] transition-shadow duration-300 flex items-center justify-between px-6 ${
        scrolled ? 'shadow-[var(--shadow-nav)]' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H8V18H4V6Z" fill="var(--accent-coral)"/>
          <path d="M16 6H20V18H16V6Z" fill="var(--accent-coral)"/>
          <path d="M8 10H16V14H8V10Z" fill="var(--accent-coral)"/>
        </svg>
        <Link href="/" className="font-lora font-bold text-[20px] tracking-tight">
          DSAKarle
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/learn" className="font-dmsans text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Learn</Link>
        <Link href="/practice" className="font-dmsans text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Practice</Link>
        <Link href="/about" className="font-dmsans text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About</Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="md:hidden text-[var(--text-primary)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <Link href="/learn" className="hidden md:inline-flex px-4 py-2 bg-[var(--accent-coral)] text-white rounded-lg font-dmsans font-medium text-sm hover:-translate-y-0.5 transition-transform">
          Shuru Karo &rarr;
        </Link>
      </div>
    </nav>
  );
}
