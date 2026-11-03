'use client';

import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'dsakarle-theme';
const ORDER: ThemeMode[] = ['system', 'light', 'dark'];
const LABEL: Record<ThemeMode, string> = { system: 'System', light: 'Light', dark: 'Dark' };

function readStored(): ThemeMode {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Mirrors the inline script in app/layout.tsx: explicit modes set data-theme, system clears it. */
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

function Icon({ mode }: { mode: ThemeMode }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (mode === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }
  if (mode === 'dark') {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
      </svg>
    );
  }
  // system: a half-filled disc
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  // Always 'system' on the server and first client render, then synced from storage.
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    setMode(readStored());
  }, []);

  // In system mode the CSS media query does the work; we only need to hear about changes
  // from other tabs so the button label stays honest.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        const next = readStored();
        setMode(next);
        applyTheme(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // While following the system, keep data-theme cleared so the media query applies, and
  // re-assert that if the OS preference flips (e.g. scheduled dark mode).
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme('system');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [mode]);

  const cycle = useCallback(() => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: theme still applies for this page view */
    }
  }, [mode]);

  const label = `Theme: ${LABEL[mode]}`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={`${label}. Click to change.`}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-cell text-ink-2 transition-colors hover:bg-coral-wash hover:text-ink md:h-10 md:w-10 ${className}`}
    >
      <Icon mode={mode} />
    </button>
  );
}

export default ThemeToggle;
