'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Glyph } from '@/components/glyph';
import { useModalBehavior } from '@/components/layout/useModalBehavior';
import { Chip } from '@/components/ui/Chip';
import { Kbd } from '@/components/ui/Kbd';
import { cn } from '@/components/ui/cn';
import { LESSONS, getLessonMeta, placeOf } from '@/lib/curriculum';
import { usePaletteStore } from '@/lib/palette-store';
import { getSearchIndex } from '@/lib/search';
import type { CurriculumLesson } from '@/types/learning';

const THEME_KEY = 'dsakarle-theme';

/** Flip between light and dark (based on what is showing now) and tell ThemeToggle. */
function toggleTheme() {
  const root = document.documentElement;
  const explicit = root.getAttribute('data-theme');
  const isDark = explicit ? explicit === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = isDark ? 'light' : 'dark';
  try {
    window.localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable: still applies for this page view */
  }
  root.setAttribute('data-theme', next);
  window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY }));
}

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

interface QuickAction {
  id: string
  label: string
  hint: string
  keywords: string
  icon: ReactNode
  run: (router: ReturnType<typeof useRouter>) => void
}

const ACTIONS: QuickAction[] = [
  {
    id: 'theme',
    label: 'Toggle theme',
    hint: 'Switch between light and dark',
    keywords: 'dark light mode appearance',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
      </svg>
    ),
    run: () => toggleTheme(),
  },
  {
    id: 'paths',
    label: 'Go to Paths',
    hint: 'Four paths, every lesson in order',
    keywords: 'learn lessons curriculum catalog paths courses',
    icon: (
      <svg {...iconProps}>
        <path d="M4 5.5h16M4 12h16M4 18.5h10" />
      </svg>
    ),
    run: (router) => router.push('/paths'),
  },
  {
    id: 'dashboard',
    label: 'Go to Dashboard',
    hint: 'Your progress, saved in this browser',
    keywords: 'progress dashboard stats completed continue reset',
    icon: (
      <svg {...iconProps}>
        <path d="M5 20V11M12 20V4M19 20v-6" />
      </svg>
    ),
    run: (router) => router.push('/dashboard'),
  },
  {
    id: 'visualize',
    label: 'Open the visualizer',
    hint: 'Every algorithm, step by step',
    keywords: 'visualize visualizer visualization animation algorithm playground lab',
    icon: (
      <svg {...iconProps}>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15l3.5-4 3 2.5L19 8" />
      </svg>
    ),
    run: (router) => router.push('/visualize'),
  },
  {
    id: 'gym',
    label: 'Open Pattern Gym',
    hint: 'Drill spotting the right pattern',
    keywords: 'gym pattern drill quiz train recognition',
    icon: (
      <svg {...iconProps}>
        <path d="M3.5 9.5v5M7 7v10M17 7v10M20.5 9.5v5M7 12h10" />
      </svg>
    ),
    run: (router) => router.push('/gym'),
  },
  {
    id: 'map',
    label: 'Go to Map',
    hint: 'How the patterns connect',
    keywords: 'pattern map graph connections',
    icon: (
      <svg {...iconProps}>
        <circle cx="6" cy="7" r="2.4" />
        <circle cx="18" cy="8" r="2.4" />
        <circle cx="12" cy="17.5" r="2.4" />
        <path d="M8.2 8l7.5.4M7.3 9.2l3.6 6.2M16.9 10.1l-3.5 5.5" />
      </svg>
    ),
    run: (router) => router.push('/map'),
  },
  {
    id: 'practice',
    label: 'Go to Practice',
    hint: 'Problems to try after a lesson',
    keywords: 'practice problems exercises',
    icon: (
      <svg {...iconProps}>
        <path d="M5 19l1-4L16.5 4.5a2 2 0 0 1 3 3L9 18z" />
        <path d="M14.5 6.5l3 3" />
      </svg>
    ),
    run: (router) => router.push('/practice'),
  },
];

type Entry =
  | { kind: 'lesson'; key: string; lesson: CurriculumLesson }
  | { kind: 'action'; key: string; action: QuickAction };

type SearchIndex = Awaited<ReturnType<typeof getSearchIndex>>;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * ⌘K / Ctrl+K / "/" opens a search-and-jump dialog: lessons (Fuse, via lib/search.ts)
 * plus a few quick actions. Mounted once, by SiteHeader.
 */
export function CommandPalette() {
  const open = usePaletteStore((state) => state.open);
  const setOpen = usePaletteStore((state) => state.setOpen);
  const router = useRouter();

  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [fuse, setFuse] = useState<SearchIndex | null>(null);

  const close = useCallback(() => setOpen(false), [setOpen]);
  useModalBehavior(open, panelRef, close);

  // Global shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey;
      if (isK) {
        event.preventDefault();
        usePaletteStore.getState().setOpen(!usePaletteStore.getState().open);
        return;
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        if (!usePaletteStore.getState().open) {
          event.preventDefault();
          usePaletteStore.getState().setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fresh state each time it opens; load the search index lazily on first open.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
  }, [open]);

  useEffect(() => {
    if (!open || fuse) return;
    let cancelled = false;
    getSearchIndex()
      .then((index) => {
        if (!cancelled) setFuse(index);
      })
      .catch(() => {
        /* offline or blocked: the plain-text fallback below still works */
      });
    return () => {
      cancelled = true;
    };
  }, [open, fuse]);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const toLesson = (lesson: CurriculumLesson): Entry => ({ kind: 'lesson', key: `lesson-${lesson.slug}`, lesson });
    const toAction = (action: QuickAction): Entry => ({ kind: 'action', key: `action-${action.id}`, action });

    if (!q) return [...ACTIONS.map(toAction), ...LESSONS.map(toLesson)];

    let lessons: CurriculumLesson[];
    if (fuse) {
      lessons = fuse
        .search(query.trim())
        .slice(0, 8)
        .map((hit) => getLessonMeta(hit.item.slug))
        .filter((lesson): lesson is CurriculumLesson => Boolean(lesson));
    } else {
      lessons = LESSONS.filter((lesson) =>
        `${lesson.title} ${lesson.oneLiner} ${lesson.trigger}`.toLowerCase().includes(q),
      ).slice(0, 8);
    }
    const actions = ACTIONS.filter((action) => `${action.label} ${action.keywords}`.toLowerCase().includes(q));
    return [...lessons.map(toLesson), ...actions.map(toAction)];
  }, [query, fuse]);

  // Keep the highlighted row in range and in view.
  useEffect(() => {
    setActive((index) => Math.min(index, Math.max(0, entries.length - 1)));
  }, [entries.length]);

  useEffect(() => {
    if (!open) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [active, open, entries]);

  const choose = useCallback(
    (entry: Entry) => {
      close();
      if (entry.kind === 'lesson') router.push(`/learn/${entry.lesson.slug}`);
      else entry.action.run(router);
    },
    [close, router],
  );

  if (!open) return null;

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (entries.length === 0 ? 0 : (index + 1) % entries.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (entries.length === 0 ? 0 : (index - 1 + entries.length) % entries.length));
    } else if (event.key === 'Enter') {
      const entry = entries[active];
      if (entry) {
        event.preventDefault();
        choose(entry);
      }
    } else if (event.key === 'Home' && !query) {
      event.preventDefault();
      setActive(0);
    }
  };

  // Section headings: first lesson row and first action row carry one.
  const firstLessonIndex = entries.findIndex((entry) => entry.kind === 'lesson');
  const firstActionIndex = entries.findIndex((entry) => entry.kind === 'action');
  const heading = (index: number): string | null => {
    if (index === firstLessonIndex) return query.trim() ? 'Lessons' : 'Lessons, in learning order';
    if (index === firstActionIndex) return 'Quick actions';
    return null;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[10vh] sm:px-4 sm:pt-[12vh]" data-testid="command-palette">
      <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons"
        tabIndex={-1}
        className="relative flex max-h-[min(80vh,640px)] w-full max-w-[640px] flex-col overflow-hidden rounded-card border border-rule-strong bg-paper-raised shadow-2"
      >
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <svg {...iconProps} className="shrink-0 text-ink-3">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            data-autofocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={entries[active] ? `${baseId}-opt-${active}` : undefined}
            aria-label="Search lessons"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search lessons, or jump somewhere…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            className="h-14 min-w-0 flex-1 bg-transparent font-sans text-[16px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            className="hidden min-h-[40px] items-center rounded-cell px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:inline-flex"
            aria-label="Esc to close search"
          >
            <Kbd>Esc</Kbd>
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-cell text-ink-2 hover:bg-coral-wash hover:text-ink sm:hidden"
          >
            <svg {...iconProps}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Results"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        >
          {entries.length === 0 ? (
            <li role="presentation" className="px-3 py-8 text-center text-[15px] text-ink-2">
              Nothing matches &ldquo;{query.trim()}&rdquo;.
              <span className="mt-1 block text-[13px] text-ink-3">Try a data structure or a pattern, like &ldquo;window&rdquo;.</span>
            </li>
          ) : (
            entries.map((entry, index) => {
              const selected = index === active;
              const label = heading(index);
              return (
                <li key={entry.key} role="presentation">
                  {label ? <p className="t-eyebrow px-3 pb-1 pt-3 first:pt-1">{label}</p> : null}
                  <div
                    role="option"
                    id={`${baseId}-opt-${index}`}
                    data-index={index}
                    aria-selected={selected}
                    onMouseMove={() => (selected ? undefined : setActive(index))}
                    onClick={() => choose(entry)}
                    className={cn(
                      'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-card px-3 py-2',
                      selected ? 'bg-coral-wash' : 'hover:bg-paper-sunken',
                    )}
                  >
                    {entry.kind === 'lesson' ? (
                      <>
                        <span className="shrink-0 text-coral-ink">
                          <Glyph id={entry.lesson.glyph} size={24} decorative />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-sans text-[15px] font-semibold text-ink">{entry.lesson.title}</span>
                          <span className={cn('block truncate text-[13px]', selected ? 'text-ink-2' : 'text-ink-3')}>{entry.lesson.oneLiner}</span>
                        </span>
                        <span className={cn('hidden shrink-0 text-[12px] sm:inline', selected ? 'text-ink-2' : 'text-ink-3')}>
                          {placeOf(entry.lesson.slug)?.path.title}
                        </span>
                        <Chip variant={entry.lesson.status === 'live' ? 'coral' : 'neutral'} className="shrink-0">
                          {entry.lesson.status === 'live' ? 'Live' : 'Draft'}
                        </Chip>
                      </>
                    ) : (
                      <>
                        <span className="shrink-0 text-ink-2">{entry.action.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-sans text-[15px] font-semibold text-ink">{entry.action.label}</span>
                          <span className={cn('block truncate text-[13px]', selected ? 'text-ink-2' : 'text-ink-3')}>{entry.action.hint}</span>
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="hidden items-center gap-4 border-t border-rule bg-paper-sunken px-4 py-2 text-[12px] text-ink-3 sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> to open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd> to close
          </span>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {entries.length === 0 ? 'No results' : `${entries.length} result${entries.length === 1 ? '' : 's'}`}
        </p>
      </div>
    </div>
  );
}

export default CommandPalette;
