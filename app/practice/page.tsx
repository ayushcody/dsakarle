'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const PROBLEMS = [
  { id: 1, title: 'Two Sum', pattern: 'hash-maps', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/two-sum/' },
  { id: 2, title: 'Best Time to Buy and Sell Stock', pattern: 'sliding-window', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { id: 3, title: 'Contains Duplicate', pattern: 'hash-maps', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/contains-duplicate/' },
  { id: 4, title: 'Maximum Subarray', pattern: 'dynamic-programming', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/maximum-subarray/' },
  { id: 5, title: 'Longest Substring Without Repeating Chars', pattern: 'sliding-window', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { id: 6, title: 'Valid Parentheses', pattern: 'stacks', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 7, title: '3Sum', pattern: 'two-pointers', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/3sum/' },
  { id: 8, title: 'Binary Search', pattern: 'binary-search', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/binary-search/' },
  { id: 9, title: 'Reverse Linked List', pattern: 'linked-lists', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/reverse-linked-list/' },
  { id: 10, title: 'Maximum Depth of Binary Tree', pattern: 'trees', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
  { id: 11, title: 'Climbing Stairs', pattern: 'dynamic-programming', difficulty: 'Easy', leetcode: 'https://leetcode.com/problems/climbing-stairs/' },
  { id: 12, title: 'Number of Islands', pattern: 'bfs-dfs', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 13, title: 'Word Search', pattern: 'backtracking', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/word-search/' },
  { id: 14, title: 'Top K Frequent Elements', pattern: 'heaps', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/top-k-frequent-elements/' },
  { id: 15, title: 'Implement Trie', pattern: 'tries', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/implement-trie-prefix-tree/' },
  { id: 16, title: 'Merge Intervals', pattern: 'sorting', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/merge-intervals/' },
  { id: 17, title: 'Subarray Sum Equals K', pattern: 'prefix-sum', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
  { id: 18, title: 'Coin Change', pattern: 'dynamic-programming', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/coin-change/' },
  { id: 19, title: 'Permutations', pattern: 'backtracking', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/permutations/' },
  { id: 20, title: 'Activity Selection', pattern: 'greedy', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/non-overlapping-intervals/' },
  { id: 21, title: 'Course Schedule', pattern: 'bfs-dfs', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/course-schedule/' },
  { id: 22, title: 'Search in Rotated Sorted Array', pattern: 'binary-search', difficulty: 'Medium', leetcode: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
  { id: 23, title: 'Trapping Rain Water', pattern: 'two-pointers', difficulty: 'Hard', leetcode: 'https://leetcode.com/problems/trapping-rain-water/' },
  { id: 24, title: 'Merge K Sorted Lists', pattern: 'heaps', difficulty: 'Hard', leetcode: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
  { id: 25, title: 'N-Queens', pattern: 'backtracking', difficulty: 'Hard', leetcode: 'https://leetcode.com/problems/n-queens/' },
];

const PATTERNS = [
  'all', 'arrays', 'hash-maps', 'sliding-window', 'two-pointers', 'stacks',
  'queues', 'linked-lists', 'trees', 'binary-search', 'dynamic-programming',
  'bfs-dfs', 'tries', 'heaps', 'backtracking', 'sorting', 'prefix-sum', 'greedy',
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Easy: { bg: 'rgba(22,163,74,0.08)', text: '#16A34A', border: 'rgba(22,163,74,0.2)' },
  Medium: { bg: 'rgba(202,138,4,0.08)', text: '#CA8A04', border: 'rgba(202,138,4,0.2)' },
  Hard: { bg: 'rgba(220,38,38,0.08)', text: '#DC2626', border: 'rgba(220,38,38,0.2)' },
};

export default function PracticePage() {
  const [search, setSearch] = useState('');
  const [activePattern, setActivePattern] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('All');

  const filtered = useMemo(() => {
    return PROBLEMS.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesPattern = activePattern === 'all' || p.pattern === activePattern;
      const matchesDifficulty = activeDifficulty === 'All' || p.difficulty === activeDifficulty;
      return matchesSearch && matchesPattern && matchesDifficulty;
    });
  }, [search, activePattern, activeDifficulty]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Practice Hub
        </h1>
        <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 16, color: 'var(--text-secondary)' }}>
          Curated problems mapped to every DSAKarle pattern. Filter by topic and difficulty.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search problems..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'white',
          fontFamily: 'var(--font-dmsans)',
          fontSize: 14,
          outline: 'none',
          marginBottom: 24,
          boxSizing: 'border-box',
        }}
      />

      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {DIFFICULTIES.map(d => (
          <button
            key={d}
            onClick={() => setActiveDifficulty(d)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-dmsans)',
              fontSize: 12,
              fontWeight: 600,
              border: activeDifficulty === d ? '1px solid transparent' : '1px solid var(--border)',
              background: activeDifficulty === d ? 'var(--accent-coral)' : 'transparent',
              color: activeDifficulty === d ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Pattern filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {PATTERNS.map(p => (
          <button
            key={p}
            onClick={() => setActivePattern(p)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 11,
              fontWeight: 500,
              border: activePattern === p ? '1px solid transparent' : '1px solid var(--border)',
              background: activePattern === p ? 'var(--accent-teal)' : 'transparent',
              color: activePattern === p ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {p.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Problem Table */}
      <div style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'white',
      }}>
        <AnimatePresence>
          {filtered.map((prob, i) => {
            const colors = DIFFICULTY_COLORS[prob.difficulty];
            return (
              <motion.div
                key={prob.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--bg-secondary)',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,144,10,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 11, color: 'var(--text-muted)', width: 24 }}>{prob.id}</span>
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{prob.title}</span>
                  <Link
                    href={`/learn/${prob.pattern}`}
                    style={{
                      fontFamily: 'var(--font-dmmono)',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize',
                      textDecoration: 'none',
                    }}
                  >
                    {prob.pattern.replace(/-/g, ' ')}
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: 'var(--font-dmmono)',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}>
                    {prob.difficulty}
                  </span>
                  <a
                    href={prob.leetcode}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-dmmono)',
                      fontSize: 11,
                      color: '#EA580C',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    LC ↗
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 0',
            fontFamily: 'var(--font-dmsans)',
            fontSize: 14,
            color: 'var(--text-muted)',
          }}>
            No problems match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
