'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { SearchIcon } from '@/components/layout/SiteHeader';
import { NAV_ITEMS, isNavActive } from '@/components/layout/nav-items';
import { useModalBehavior } from '@/components/layout/useModalBehavior';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn, focusRing } from '@/components/ui/cn';
import { useProgress } from '@/hooks/useProgress';
import { PATHS, getLessonMeta, placeOf } from '@/lib/curriculum';
import { useNavStore } from '@/lib/nav-store';
import { usePaletteStore } from '@/lib/palette-store';
import { usePathname } from 'next/navigation';

/** Empty circle, or a filled ✓ circle when done. Always paired with sr-only text. */
function ProgressCircle({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
        done ? 'border-coral-ink bg-coral-ink text-paper' : 'border-rule-strong',
      )}
    >
      {done ? (
        <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3L12.5 5" />
        </svg>
      ) : null}
      <span className="sr-only">{done ? 'Completed' : 'Not completed'}</span>
    </span>
  );
}

/**
 * The path-contents sidebar. On md+ it sits under the header (top-16) as a rail;
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

  const place = placeOf(currentSlug);
  const path = place?.path;
  const pathSlugs = path ? path.sections.flatMap((section) => section.lessons) : [];
  const done = mounted ? pathSlugs.filter((slug) => progress.completedSections.includes(slug)).length : 0;
  const percent = pathSlugs.length > 0 ? Math.round((done / pathSlugs.length) * 100) : 0;
  const otherPaths = PATHS.filter((p) => p.id !== path?.id);

  return (
    <>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[55] bg-black/40 md:hidden" onClick={closeMobileNav} aria-hidden="true" />
      ) : null}
      <aside
        ref={asideRef}
        id="lesson-sidebar"
        aria-label="Course sidebar"
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
              aria-label="Close menu"
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
                'flex min-h-[44px] flex-1 items-center gap-2 rounded-card border border-control bg-paper-sunken px-3 text-left text-[14px] text-ink-3 hover:border-ink-3',
                focusRing,
              )}
            >
              <SearchIcon className="shrink-0" />
              Search lessons…
            </button>
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Path contents" className="flex-1 px-4 pb-6 pt-5">
          <Link
            href="/paths"
            onClick={closeMobileNav}
            className={cn('inline-flex min-h-[40px] items-center gap-1 rounded-cell font-sans text-[13px] text-ink-3 hover:text-ink', focusRing)}
          >
            <span aria-hidden="true">←</span> All paths
          </Link>

          {path ? (
            <>
              <Link
                href={`/paths/${path.id}`}
                onClick={closeMobileNav}
                className={cn('mt-1 block rounded-cell font-sans text-[16px] font-semibold leading-6 text-ink hover:text-coral-ink', focusRing)}
              >
                {path.title}
              </Link>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunken"
                role="progressbar"
                aria-label={`${path.title} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${done} of ${pathSlugs.length} lessons done`}
              >
                <div className="h-full rounded-pill bg-coral-ink transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1.5 text-[12px] text-ink-3">
                {done} of {pathSlugs.length} done
              </p>

              {path.sections.map((section) => (
                <div key={section.title} className="mt-6">
                  <h3 className="t-eyebrow pb-1.5">{section.title}</h3>
                  <ul className="m-0 flex list-none flex-col p-0">
                    {section.lessons.map((slug) => {
                      const lesson = getLessonMeta(slug);
                      if (!lesson) return null;
                      const isActive = slug === currentSlug;
                      const isDone = mounted && progress.completedSections.includes(slug);
                      return (
                        <li key={slug}>
                          <Link
                            href={`/learn/${slug}`}
                            onClick={closeMobileNav}
                            data-lesson-row
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'flex min-h-[40px] items-center gap-2.5 border-l-2 py-1.5 pl-3 pr-2 font-sans text-[14px] leading-5 transition-colors duration-150 md:min-h-[36px]',
                              focusRing,
                              isActive
                                ? 'border-coral-ink font-semibold text-ink'
                                : 'border-transparent text-ink-2 hover:border-rule-strong hover:text-ink',
                            )}
                          >
                            <ProgressCircle done={isDone} />
                            <span className="min-w-0 flex-1">{lesson.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </>
          ) : null}

          {otherPaths.length > 0 ? (
            <div className="mt-8 border-t border-rule pt-4">
              <h3 className="t-eyebrow pb-1.5">Other paths</h3>
              <ul className="m-0 flex list-none flex-col p-0">
                {otherPaths.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/paths/${other.id}`}
                      onClick={closeMobileNav}
                      className={cn('flex min-h-[36px] items-center rounded-cell py-1 font-sans text-[13px] text-ink-3 hover:text-ink', focusRing)}
                    >
                      {other.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
