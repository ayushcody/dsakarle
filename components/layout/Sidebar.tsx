'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { Glyph } from '@/components/glyph';
import { SearchIcon } from '@/components/layout/SiteHeader';
import { NAV_ITEMS, isNavActive } from '@/components/layout/nav-items';
import { useModalBehavior } from '@/components/layout/useModalBehavior';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn, focusRing } from '@/components/ui/cn';
import { useProgress } from '@/hooks/useProgress';
import { COURSE_TOPICS, countCompletedLessons, getCourseProgressPercent } from '@/lib/course';
import { CURRICULUM, lessonsInGroup } from '@/lib/curriculum';
import { useNavStore } from '@/lib/nav-store';
import { usePaletteStore } from '@/lib/palette-store';
import { usePathname } from 'next/navigation';

/** ✓ done, a coral dot for Live, a hollow ring for Draft. Always paired with sr-only text. */
function StatusMark({ done, status }: { done: boolean; status: 'live' | 'draft' }) {
  if (done) {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-role-found" title="Done">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8.5l3.2 3.2L13 4.8" />
        </svg>
        <span className="sr-only">Done</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
      title={status === 'live' ? 'Live' : 'Draft'}
    >
      <span
        aria-hidden="true"
        className={cn('h-2 w-2 rounded-full', status === 'live' ? 'bg-coral' : 'border border-ink-3')}
      />
      <span className="sr-only">{status === 'live' ? 'Live' : 'Draft'}</span>
    </span>
  );
}

/**
 * The lesson sidebar. On md+ it sits under the header (top-16) as a rail;
 * below md it is a drawer opened from the header's menu button (nav-store),
 * with the site nav, search and theme at its top.
 */
export function Sidebar({ currentSlug }: { currentSlug: string }) {
  const { progress, mounted } = useProgress();
  const pathname = usePathname();
  const mobileNavOpen = useNavStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useNavStore((state) => state.setMobileNavOpen);
  const openPalette = usePaletteStore((state) => state.openPalette);
  const asideRef = useRef<HTMLElement>(null);
  const [isDrawer, setIsDrawer] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  // Below md the aside is a modal drawer; track that so the rail on desktop is never "modal".
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setIsDrawer(mq.matches);
      if (!mq.matches) setMobileNavOpen(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [setMobileNavOpen]);

  const drawerOpen = isDrawer && mobileNavOpen;
  useModalBehavior(drawerOpen, asideRef, closeMobileNav);

  // Close the drawer when the route changes (e.g. after picking a lesson).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  // Bring the current lesson into view inside the rail (never scrolls the page).
  useEffect(() => {
    const aside = asideRef.current;
    const current = aside?.querySelector<HTMLElement>('[aria-current="page"][data-lesson-row]');
    // In the drawer (below md) keep the menu and nav at the top visible instead.
    if (!aside || !current || aside.getClientRects().length === 0 || window.matchMedia('(max-width: 767px)').matches) return;
    const top = current.offsetTop - aside.clientHeight / 2 + current.clientHeight / 2;
    aside.scrollTop = Math.max(0, top);
  }, [currentSlug]);

  const total = COURSE_TOPICS.length;
  const done = mounted ? countCompletedLessons(progress.completedSections) : 0;
  const overallProgress = mounted ? getCourseProgressPercent(progress.completedSections) : 0;

  return (
    <>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[55] bg-black/40 md:hidden" onClick={closeMobileNav} aria-hidden="true" />
      ) : null}
      <aside
        ref={asideRef}
        id="lesson-sidebar"
        aria-label="Lesson navigation"
        role={drawerOpen ? 'dialog' : undefined}
        aria-modal={drawerOpen ? true : undefined}
        tabIndex={drawerOpen ? -1 : undefined}
        className={cn(
          'custom-scrollbar fixed left-0 z-[60] w-[300px] max-w-[88vw] flex-col overflow-y-auto border-r border-rule bg-paper-raised',
          'top-0 h-[100dvh] md:top-16 md:z-30 md:h-[calc(100vh-4rem)] md:w-[280px]',
          mobileNavOpen ? 'flex' : 'hidden md:flex',
        )}
      >
        {/* Drawer-only top: site nav, search and theme (the header's menu is replaced by this drawer on lessons). */}
        <div className="md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-rule px-4">
            <span className="t-eyebrow">Menu</span>
            <button
              type="button"
              onClick={closeMobileNav}
              aria-label="Close lesson menu"
              className={cn('-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-card text-ink-2 hover:bg-coral-wash hover:text-ink', focusRing)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav aria-label="Main" className="grid grid-cols-2 gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileNav}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-card px-3 font-sans text-[15px] font-medium',
                    focusRing,
                    active ? 'bg-coral-wash font-semibold text-coral-ink' : 'text-ink-2 hover:bg-paper-sunken hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 border-b border-rule px-3 pb-3">
            <button
              type="button"
              onClick={() => {
                closeMobileNav();
                openPalette();
              }}
              className={cn(
                'flex min-h-[44px] flex-1 items-center gap-2 rounded-card border border-rule bg-paper-sunken px-3 text-left text-[14px] text-ink-3 hover:border-rule-strong',
                focusRing,
              )}
            >
              <SearchIcon className="shrink-0" />
              Search lessons…
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Overall progress, kept compact */}
        <div className="px-4 pb-2 pt-4">
          <div className="rounded-card border border-rule bg-paper p-3">
            <div className="flex items-baseline justify-between">
              <span className="t-eyebrow">Overall progress</span>
              <span className="font-sans text-[13px] font-semibold tabular-nums text-ink">{overallProgress}%</span>
            </div>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunken"
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
              aria-valuetext={`${done} of ${total} lessons done`}
            >
              <div className="h-full rounded-pill bg-coral transition-[width] duration-500 ease-out" style={{ width: `${overallProgress}%` }} />
            </div>
            <p className="mt-1.5 text-[12px] text-ink-3">
              {done} of {total} lessons done
            </p>
          </div>
        </div>

        {/* Lessons, by group */}
        <nav aria-label="Lessons" className="flex-1 px-2 pb-4">
          {CURRICULUM.groups.map((group) => (
            <div key={group.id} className="mt-4">
              <h3 className="t-eyebrow px-3 pb-1.5">{group.title}</h3>
              <ul className="flex flex-col gap-0.5">
                {lessonsInGroup(group.id).map((lesson) => {
                  const isActive = lesson.slug === currentSlug;
                  const isDone = mounted && progress.completedSections.includes(lesson.slug);
                  return (
                    <li key={lesson.slug}>
                      <Link
                        href={`/learn/${lesson.slug}`}
                        onClick={closeMobileNav}
                        data-lesson-row
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[40px] items-center gap-2.5 rounded-card px-3 py-1.5 font-sans text-[14px] transition-colors duration-150 md:min-h-[36px]',
                          focusRing,
                          isActive
                            ? 'bg-coral-wash font-semibold text-coral-ink'
                            : 'text-ink-2 hover:bg-paper-sunken hover:text-ink',
                        )}
                      >
                        <Glyph id={lesson.glyph} size={16} decorative className={isActive ? 'text-coral-ink' : 'text-ink-3'} />
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        <StatusMark done={isDone} status={lesson.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 text-[12px] text-ink-3" aria-hidden="true">
            <span className="inline-flex items-center gap-1">
              <span className="text-role-found">✓</span> done
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-coral" /> live
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-ink-3" /> draft
            </span>
          </p>
        </nav>

        <div className="border-t border-rule px-5 py-4">
          <Link
            href="/practice"
            onClick={closeMobileNav}
            className={cn('inline-flex min-h-[40px] items-center gap-1.5 rounded-cell font-sans text-[14px] font-semibold text-coral-ink hover:underline hover:underline-offset-4', focusRing)}
          >
            Practice problems <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
