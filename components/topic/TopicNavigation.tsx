'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Must match sidebar's topic order from course-structure.json
const TOPIC_ORDER = [
  'arrays', 'vectors', 'strings', 'linked-lists',
  'stacks', 'queues', 'hash-maps', 'trees',
  'bst', 'heaps', 'graphs', 'tries',
  'sliding-window', 'two-pointers', 'prefix-sum',
  'binary-search', 'sorting', 'searching',
  'recursion', 'dynamic-programming', 'greedy', 'bfs-dfs',
];

interface TopicNavigationProps {
  currentSlug: string;
}

export function TopicNavigation({ currentSlug }: TopicNavigationProps) {
  const currentIndex = TOPIC_ORDER.indexOf(currentSlug);
  const prevSlug = currentIndex > 0 ? TOPIC_ORDER[currentIndex - 1] : null;
  const nextSlug = currentIndex < TOPIC_ORDER.length - 1 ? TOPIC_ORDER[currentIndex + 1] : null;

  const formatLabel = (slug: string) =>
    slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  return (
    <div style={{
      marginTop: 56,
      paddingTop: 32,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      {prevSlug ? (
        <motion.div whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link href={`/learn/${prevSlug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 11, color: 'var(--text-muted)' }}>← Previous</span>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatLabel(prevSlug)}
            </span>
          </Link>
        </motion.div>
      ) : <div />}

      {nextSlug ? (
        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link href={`/learn/${nextSlug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 11, color: 'var(--text-muted)' }}>Next →</span>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatLabel(nextSlug)}
            </span>
          </Link>
        </motion.div>
      ) : <div />}
    </div>
  );
}

export default TopicNavigation;
