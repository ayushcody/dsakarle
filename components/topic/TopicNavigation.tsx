'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { COURSE_TOPICS } from '@/lib/course';

interface TopicNavigationProps {
  currentSlug: string;
}

export function TopicNavigation({ currentSlug }: TopicNavigationProps) {
  const currentIndex = COURSE_TOPICS.findIndex((topic) => topic.slug === currentSlug);

  // Lessons outside the course structure have no defined neighbours.
  if (currentIndex === -1) {
    return null;
  }

  const prevTopic = currentIndex > 0 ? COURSE_TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < COURSE_TOPICS.length - 1 ? COURSE_TOPICS[currentIndex + 1] : null;

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
      {prevTopic ? (
        <motion.div whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link href={`/learn/${prevTopic.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 11, color: 'var(--text-muted)' }}>← Previous</span>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {prevTopic.title}
            </span>
          </Link>
        </motion.div>
      ) : <div />}

      {nextTopic ? (
        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link href={`/learn/${nextTopic.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 11, color: 'var(--text-muted)' }}>Next →</span>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {nextTopic.title}
            </span>
          </Link>
        </motion.div>
      ) : <div />}
    </div>
  );
}

export default TopicNavigation;
