'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { getSearchIndex } from '@/lib/search';
import type { TopicMeta } from '@/types/learning';

export function SearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TopicMeta[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;

    if (!query.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    getSearchIndex().then((fuse) => {
      if (cancelled) {
        return;
      }
      setResults(fuse.search(query).slice(0, 8).map((item) => item.item));
      setActiveIndex(-1);
    });

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
  }, [pathname]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }

          if (event.key === 'Escape') {
            setQuery('');
            setResults([]);
            setActiveIndex(-1);
          }

          if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault();
            router.push(`/learn/${results[activeIndex].slug}`);
          }
        }}
        placeholder="Search topics, patterns, and tags"
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 font-dmsans text-[15px] text-[var(--text-primary)] shadow-[var(--shadow-card)] outline-none focus:border-[var(--accent-coral)]"
      />
      {results.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-white shadow-[var(--shadow-card-hover)]">
          {results.map((result, index) => (
            <Link
              key={result.slug}
              href={`/learn/${result.slug}`}
              className={`flex items-center justify-between border-t border-[var(--border)] px-4 py-3 first:border-t-0 ${
                activeIndex === index ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="font-dmsans text-sm text-[var(--text-primary)]">{result.title}</span>
              <span className="badge-pill badge-pill-amber">{result.category}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
