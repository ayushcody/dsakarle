'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

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
        <Image src="/DSAKarle_Logo.png" alt="DSA Karle Logo" width={32} height={32} className="object-contain" />
        <Link href="/" className="font-dmsans font-bold text-[20px] tracking-tight text-[var(--text-primary)]">
          DSA Karle
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/learn" className={`font-dmsans text-[15px] transition-colors relative ${isActive('/learn') ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          Learn
          {isActive('/learn') && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[var(--accent-coral)] rounded-full"></span>}
        </Link>

        <Link href="/practice" className={`font-dmsans text-[15px] transition-colors relative ${isActive('/practice') ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          Practice
          {isActive('/practice') && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[var(--accent-coral)] rounded-full"></span>}
        </Link>
        <Link href="/about" className={`font-dmsans text-[15px] transition-colors relative ${isActive('/about') ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          About
          {isActive('/about') && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[var(--accent-coral)] rounded-full"></span>}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="md:hidden text-[var(--text-primary)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <Link href="/learn" className="hidden md:inline-flex px-4 py-2 bg-[var(--accent-coral)] text-[var(--white)] rounded-lg font-dmsans font-medium text-sm hover:-translate-y-0.5 transition-transform">
          Start Learning &rarr;
        </Link>
      </div>
    </nav>
  );
}
