'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/brand/Logo';
import { CommandPalette } from '@/components/search/CommandPalette';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, focusRing } from '@/components/ui/cn';
import { useProgress } from '@/hooks/useProgress';
import { COURSE_TOPICS, countCompletedLessons, getCourseProgressPercent } from '@/lib/course';
import { LESSONS, isCurriculumSlug } from '@/lib/curriculum';
import { useNavStore } from '@/lib/nav-store';
import { usePaletteStore } from '@/lib/palette-store';

import { NAV_ITEMS, isNavActive } from './nav-items';
import { useModalBehavior } from './useModalBehavior';

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps} width={22} height={22}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** A hand-drawn wavy underline for the active nav item. */
function Sketch() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 6"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-3 bottom-0.5 h-[6px] w-[calc(100%-1.5rem)] text-coral"
      fill="none"
    >
      <path
        d="M1 3.6C8 1 14 5.4 21 3 28 .8 33 5 40 3.2 47 1.4 52 4.6 59 2.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Small progress ring + percentage. Hidden (but space-reserved) until localStorage has been read. */
export function ProgressRing({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { progress, mounted } = useProgress();
  const done = countCompletedLessons(progress.completedSections);
  const total = COURSE_TOPICS.length;
  const percent = getCourseProgressPercent(progress.completedSections);
  const r = 11;
  const circumference = 2 * Math.PI * r;
  const label = `${done} of ${total} lessons done`;

  return (
    <Tooltip content={label} side="bottom">
      <Link
        href="/learn"
        onClick={onNavigate}
        aria-label={`Progress: ${label}`}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-card px-2 text-ink-2 hover:bg-coral-wash hover:text-ink',
          focusRing,
          !mounted && 'invisible',
          className,
        )}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="-rotate-90">
          <circle cx="14" cy="14" r={r} stroke="var(--rule-strong)" strokeWidth="3" />
          <circle
            cx="14"
            cy="14"
            r={r}
            stroke="var(--coral)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
            style={{ transition: 'stroke-dasharray 400ms ease-out' }}
          />
        </svg>
        <span className="font-sans text-[13px] font-semibold tabular-nums">{percent}%</span>
      </Link>
    </Tooltip>
  );
}

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere (decided after mount so server and client markup match). */
function useShortcutLabel(): string {
  const [label, setLabel] = useState('⌘K');
  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent || '';
    if (!/Mac|iPhone|iPad|iPod/i.test(platform)) setLabel('Ctrl K');
  }, []);
  return label;
}

export function SiteHeader() {
  const pathname = usePathname() ?? '';
  const openPalette = usePaletteStore((state) => state.openPalette);
  const mobileNavOpen = useNavStore((state) => state.mobileNavOpen);
  const toggleMobileNav = useNavStore((state) => state.toggleMobileNav);
  const setMobileNavOpen = useNavStore((state) => state.setMobileNavOpen);
  const { progress, mounted } = useProgress();
  const shortcut = useShortcutLabel();

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasLessonSidebar, setHasLessonSidebar] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // A lesson page is /learn/<known slug>; there the left Sidebar exists and the CTA is noise.
  const lessonSlug = pathname.startsWith('/learn/') ? pathname.split('/')[2] : '';
  const isLesson = Boolean(lessonSlug) && isCurriculumSlug(lessonSlug);

  // The hamburger opens the lesson drawer only if this page actually rendered the Sidebar.
  useEffect(() => {
    setHasLessonSidebar(isLesson && Boolean(document.getElementById('lesson-sidebar')));
  }, [isLesson, pathname]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useModalBehavior(menuOpen, sheetRef, closeMenu);

  // Navigating, or widening past the mobile breakpoint, dismisses the sheet.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const nextLesson = LESSONS.find((lesson) => !progress.completedSections.includes(lesson.slug));
  const startHref = `/learn/${(mounted && nextLesson ? nextLesson : LESSONS[0]).slug}`;
  const hasStarted = mounted && countCompletedLessons(progress.completedSections) > 0;
  const ctaLabel = hasStarted ? 'Continue learning' : 'Start learning';

  const onMenuClick = () => {
    if (hasLessonSidebar) {
      toggleMobileNav();
    } else {
      setMobileNavOpen(false);
      setMenuOpen(true);
    }
  };

  const onSkip = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('main-content') ?? document.querySelector<HTMLElement>('main');
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: false });
  };

  const openSearchFromMenu = () => {
    setMenuOpen(false);
    openPalette();
  };

  return (
    <>
      <header
        data-testid="site-header"
        className="fixed inset-x-0 top-0 z-50 h-16 border-b border-rule bg-[color-mix(in_srgb,var(--paper)_85%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--paper)_80%,transparent)]"
      >
        <a
          href="#main-content"
          onClick={onSkip}
          className="sr-only rounded-card bg-paper-raised px-4 py-2 text-[14px] font-semibold text-ink shadow-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[90]"
        >
          Skip to content
        </a>
        <div className="flex h-full items-center gap-2 px-4 md:px-6">
          <Logo href="/" size="md" className="-ml-1 px-1 py-1" />

          <nav aria-label="Main" className="ml-2 hidden items-center md:flex lg:ml-6">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex min-h-[40px] items-center rounded-cell px-3 pb-0.5 font-sans text-[15px] transition-colors duration-150',
                    focusRing,
                    active ? 'font-semibold text-coral-ink' : 'font-medium text-ink-2 hover:bg-coral-wash hover:text-ink',
                  )}
                >
                  {item.label}
                  {active ? <Sketch /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={openPalette}
              aria-label="Search lessons"
              aria-keyshortcuts="Control+K Meta+K"
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center gap-2 rounded-card text-ink-2 transition-colors hover:bg-coral-wash hover:text-ink',
                'md:h-10 md:w-10',
                'lg:w-[236px] lg:justify-start lg:border lg:border-rule lg:bg-paper-sunken lg:px-3 lg:text-ink-3 lg:hover:border-rule-strong lg:hover:bg-paper-sunken',
                focusRing,
              )}
            >
              <SearchIcon className="shrink-0" />
              <span className="hidden flex-1 text-left text-[14px] lg:inline">Search lessons…</span>
              <Kbd className="hidden lg:inline-flex">{shortcut}</Kbd>
            </button>

            <span className="hidden lg:inline-flex">
              <ProgressRing />
            </span>
            <ThemeToggle className="hidden md:inline-flex" />

            {!isLesson ? (
              <Button href={startHref} size="sm" className="hidden md:inline-flex">
                {ctaLabel}
              </Button>
            ) : null}

            <button
              type="button"
              onClick={onMenuClick}
              aria-label={hasLessonSidebar ? (mobileNavOpen ? 'Close lesson menu' : 'Open lesson menu') : 'Open menu'}
              aria-expanded={hasLessonSidebar ? mobileNavOpen : menuOpen}
              aria-controls={hasLessonSidebar ? 'lesson-sidebar' : 'site-menu'}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-card text-ink hover:bg-coral-wash md:hidden',
                focusRing,
              )}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Siblings of <header>, not children: its backdrop-filter would otherwise trap `position: fixed`. */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeMenu} aria-hidden="true" />
          <div
            ref={sheetRef}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto border-l border-rule bg-paper-raised shadow-2"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-4">
              <Logo href="/" size="sm" onClick={closeMenu} className="px-1 py-1" />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className={cn('inline-flex h-11 w-11 items-center justify-center rounded-card text-ink-2 hover:bg-coral-wash hover:text-ink', focusRing)}
              >
                <CloseIcon />
              </button>
            </div>

            <nav aria-label="Main" className="flex flex-col gap-1 p-3">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[48px] items-center rounded-card px-3 font-serif text-[20px] font-semibold',
                      focusRing,
                      active ? 'bg-coral-wash text-coral-ink' : 'text-ink hover:bg-paper-sunken',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t border-rule p-4">
              <button
                type="button"
                onClick={openSearchFromMenu}
                className={cn(
                  'flex min-h-[48px] items-center gap-3 rounded-card border border-rule bg-paper-sunken px-3 text-left text-[15px] text-ink-2 hover:border-rule-strong',
                  focusRing,
                )}
              >
                <SearchIcon className="shrink-0 text-ink-3" />
                Search lessons…
              </button>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-2">Theme</span>
                <ThemeToggle />
              </div>
              <ProgressRing onNavigate={closeMenu} className="-ml-2 self-start" />
              <Button href={startHref} onClick={closeMenu} className="w-full">
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <CommandPalette />
    </>
  );
}

export default SiteHeader;
