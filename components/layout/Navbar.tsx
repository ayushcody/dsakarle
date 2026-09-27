'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { SearchModal } from './SearchModal';

const LINKS = [
  { href: '/learn', label: 'Learn' },
  { href: '/practice', label: 'Practice' },
  { href: '/map', label: 'Roadmap' },
];

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('dsakarle_theme', next ? 'dark' : 'light'); } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-coral)]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dark ? (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--border)] px-3 font-dmsans text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <kbd className="hidden font-dmmono text-[11px] lg:inline">⌘K</kbd>
      </button>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex h-[64px] items-center justify-between border-b px-4 transition-[background-color,border-color,box-shadow] duration-300 sm:px-6 ${
        scrolled ? 'border-[var(--border)] bg-[var(--bg-primary)]/80 shadow-[var(--shadow-nav)] backdrop-blur-[12px]' : 'border-transparent bg-[var(--bg-primary)]'
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <Image src="/DSAKarle_Logo.png" alt="" width={32} height={32} className="object-contain" />
        <span className="font-dmsans text-[20px] font-bold tracking-tight text-[var(--text-primary)]">DSA Karle</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`relative font-dmsans text-[15px] transition-colors ${isActive(l.href) ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {l.label}
            {isActive(l.href) && <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-[var(--accent-coral)]" />}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SearchTrigger />
        <ThemeToggle />
        <Link href="/learn" className="hidden rounded-lg bg-[var(--accent-coral)] px-4 py-2 font-dmsans text-sm font-medium text-white transition-transform hover:-translate-y-0.5 md:inline-flex">
          Start Learning →
        </Link>
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="p-1 text-[var(--text-primary)] md:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-[55] bg-black/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className="fixed right-0 top-0 z-[60] flex h-screen w-[78vw] max-w-[320px] flex-col gap-2 bg-[var(--bg-secondary)] p-6 shadow-2xl md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="mb-4 self-end text-2xl text-[var(--text-secondary)]">×</button>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-3 font-dmsans text-lg font-bold ${isActive(l.href) ? 'bg-[var(--surface-coral)] text-[var(--accent-coral)]' : 'text-[var(--text-primary)]'}`}>
                  {l.label}
                </Link>
              ))}
              <Link href="/learn" className="mt-4 rounded-lg bg-[var(--accent-coral)] px-4 py-3 text-center font-dmsans font-bold text-white">Start Learning →</Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
