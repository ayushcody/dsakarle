'use client';

import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Entry = { kind: 'Topics' | 'Concepts' | 'Practice Problems'; title: string; subtitle: string; href: string };

const KINDS: Entry['kind'][] = ['Topics', 'Concepts', 'Practice Problems'];
let cache: Promise<Fuse<Entry>> | null = null;
const load = () =>
  (cache ??= fetch('/search-all.json')
    .then((r) => r.json())
    .then((data: Entry[]) => new Fuse(data, { threshold: 0.35, keys: [{ name: 'title', weight: 0.7 }, { name: 'subtitle', weight: 0.3 }] })));

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Entry> | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    load().then(setFuse);
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    const hits = fuse.search(query).map((h) => h.item);
    return KINDS.flatMap((k) => hits.filter((h) => h.kind === k).slice(0, 5));
  }, [fuse, query]);

  const go = (e: Entry) => {
    onClose();
    if (e.href.startsWith('http')) window.open(e.href, '_blank', 'noopener,noreferrer');
    else router.push(e.href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--white)] shadow-[var(--shadow-card-hover)]"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === 'Enter' && results[active]) go(results[active]);
              }}
              placeholder="Search topics, concepts, problems…"
              className="w-full border-b border-[var(--border)] bg-transparent px-5 py-4 font-dmsans text-lg text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim() && results.length === 0 && (
                <p className="px-4 py-8 text-center font-dmsans text-[var(--text-muted)]">No matches for “{query}”. Try a pattern name like “window”.</p>
              )}
              {KINDS.map((k) => {
                const group = results.filter((r) => r.kind === k);
                if (!group.length) return null;
                return (
                  <div key={k} className="mb-2">
                    <p className="px-3 pb-1 pt-2 font-dmsans text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{k}</p>
                    {group.map((r) => {
                      const i = results.indexOf(r);
                      return (
                        <button
                          key={`${r.kind}-${r.href}-${r.title}`}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(r)}
                          className={`block w-full rounded-[10px] px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-[var(--surface-coral)]' : ''}`}
                        >
                          <span className="block font-dmsans font-bold text-[var(--text-primary)]">{r.title}</span>
                          <span className="block truncate font-dmsans text-sm text-[var(--text-secondary)]">{r.subtitle}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 border-t border-[var(--border)] px-5 py-2.5 font-dmmono text-[11px] text-[var(--text-muted)]">
              <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
