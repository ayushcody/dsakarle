'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  status: 'Solved' | 'Unsolved';
  url: string;
}

const PROBLEMS: Problem[] = [
  { id: 1, title: 'Two Sum', description: 'Find two numbers that add up to a target.', difficulty: 'BEGINNER', tags: ['Arrays', 'Hash Maps'], status: 'Unsolved', url: 'https://leetcode.com/problems/two-sum/' },
  { id: 2, title: 'Valid Parentheses', description: 'Determine if the input string has valid matching brackets.', difficulty: 'BEGINNER', tags: ['Stacks'], status: 'Solved', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 3, title: 'Merge Two Sorted Lists', description: 'Merge two sorted linked lists into one sorted list.', difficulty: 'BEGINNER', tags: ['Linked Lists'], status: 'Unsolved', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { id: 4, title: 'Maximum Depth of Binary Tree', description: 'Find the maximum depth/height of a binary tree.', difficulty: 'BEGINNER', tags: ['Trees', 'DFS'], status: 'Unsolved', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
  { id: 5, title: 'Top K Frequent Elements', description: 'Return the k most frequent elements in an array.', difficulty: 'INTERMEDIATE', tags: ['Arrays', 'Heaps'], status: 'Unsolved', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
  { id: 6, title: 'Container With Most Water', description: 'Find two lines that together with the x-axis forms a container containing the most water.', difficulty: 'INTERMEDIATE', tags: ['Two Pointers', 'Arrays'], status: 'Unsolved', url: 'https://leetcode.com/problems/container-with-most-water/' },
  { id: 7, title: 'Longest Substring Without Repeating Characters', description: 'Find the length of the longest substring without repeating characters.', difficulty: 'INTERMEDIATE', tags: ['Sliding Window', 'Strings'], status: 'Unsolved', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { id: 8, title: 'Lowest Common Ancestor of a BST', description: 'Find the lowest common ancestor node of two given nodes in a BST.', difficulty: 'BEGINNER', tags: ['BST', 'Trees'], status: 'Unsolved', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },
  { id: 9, title: 'Number of Islands', description: 'Given an m x n 2D binary grid, return the number of islands.', difficulty: 'INTERMEDIATE', tags: ['Graphs', 'BFS-DFS'], status: 'Unsolved', url: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 10, title: 'Edit Distance', description: 'Given two strings, find the minimum number of operations required to convert word1 to word2.', difficulty: 'ADVANCED', tags: ['Dynamic Programming', 'Strings'], status: 'Unsolved', url: 'https://leetcode.com/problems/edit-distance/' }
];

export default function PracticePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulties');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [solvedList, setSolvedList] = useState<Record<number, boolean>>({
    2: true // Default solved problem
  });

  // Extract all unique tags/topics for dropdown
  const allTopics = useMemo(() => {
    const tags = new Set<string>();
    PROBLEMS.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  // Filter problems based on states
  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter(prob => {
      const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            prob.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = selectedDifficulty === 'All Difficulties' || 
                                prob.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesTopic = selectedTopic === 'All Topics' ||
                           prob.tags.includes(selectedTopic);

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [searchQuery, selectedDifficulty, selectedTopic]);

  const toggleSolved = (id: number) => {
    setSolvedList(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const solvedCount = Object.values(solvedList).filter(Boolean).length;
  const accuracy = solvedCount > 0 ? 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h1 className="font-dmsans text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">Practice Hub</h1>
        <p className="font-dmsans text-[var(--text-secondary)] text-lg max-w-2xl">
          Curated DSA problem sets designed to build your intuition. Apply the patterns you&apos;ve learned to solve real challenges.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="max-w-7xl mx-auto px-6 mb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Solved</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--text-primary)]">{solvedCount}/{PROBLEMS.length}</p>
        </div>
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Day Streak</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--accent-coral)]">2 <span className="text-xl">days</span></p>
        </div>
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Accuracy</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--state-success)]">{accuracy}%</p>
        </div>
        <div className="bg-[var(--bg-secondary)] p-6 rounded-[var(--radius)] border border-[var(--accent-amber)] border-opacity-50 shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--accent-amber)] uppercase tracking-widest mb-1">Recommended</p>
          <p className="font-dmsans text-xl font-bold text-[var(--text-primary)] mt-1">Arrays Core Set</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-6 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search problems..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent-coral)] font-dmsans"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white font-dmsans focus:outline-none"
          >
            <option>All Difficulties</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <select 
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white font-dmsans focus:outline-none"
          >
            <option>All Topics</option>
            {allTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem Table */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[var(--white)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
          {filteredProblems.map((prob, index) => {
            const isSolved = !!solvedList[prob.id];
            return (
              <div key={prob.id} className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[var(--bg-secondary)] transition-colors ${index !== filteredProblems.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => toggleSolved(prob.id)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSolved ? 'bg-[var(--surface-success)] text-[var(--state-success)]' : 'bg-[var(--bg-primary)] border border-[var(--border-strong)] hover:border-[var(--state-success)]'}`}
                  >
                    {isSolved && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </button>
                  <div>
                    <h3 className="font-dmsans font-bold text-lg text-[var(--text-primary)] mb-1">{prob.title}</h3>
                    <p className="font-dmsans text-[var(--text-secondary)] text-sm mb-3">{prob.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${
                        prob.difficulty === 'BEGINNER' 
                          ? 'bg-[var(--surface-success)] text-[var(--state-success)]' 
                          : prob.difficulty === 'INTERMEDIATE'
                          ? 'bg-[var(--surface-amber)] text-[var(--accent-amber)]'
                          : 'bg-[var(--surface-coral)] text-[var(--accent-coral)]'
                      }`}>
                        {prob.difficulty}
                      </span>
                      {prob.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link 
                  href={prob.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full font-dmsans font-bold text-sm transition-all shadow-sm ${isSolved ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)]' : 'bg-[var(--accent-coral)] text-white hover:bg-[var(--accent-coral-dark)]'}`}
                >
                  {isSolved ? 'Solve Again' : 'Solve'}
                </Link>
              </div>
            );
          })}

          {filteredProblems.length === 0 && (
            <div className="p-12 text-center text-[var(--text-muted)] font-dmsans">
              No problems found matching filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
