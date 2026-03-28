import fs from 'fs';
import path from 'path';

import type { LearningTopicPage, TopicDifficulty, TopicMeta } from '@/types/learning';

type CatalogTopic = {
  title: string
  slug: string
  difficulty: TopicDifficulty
  category: 'data-structure' | 'algorithm'
}

const TOPICS_DIR = path.join(process.cwd(), 'content', 'topics');

const homeCatalogTopics: CatalogTopic[] = [
  { title: 'Arrays & Vectors', slug: 'arrays', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Linked Lists', slug: 'linked-lists', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Stacks & Queues', slug: 'stacks-queues', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Binary Trees', slug: 'trees', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Graphs', slug: 'graphs', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Heaps', slug: 'heaps', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Tries', slug: 'tries', difficulty: 'advanced', category: 'data-structure' },
  { title: 'Hash Maps', slug: 'hash-maps', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Sliding Window', slug: 'sliding-window', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Two Pointers', slug: 'two-pointers', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Binary Search', slug: 'binary-search', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Sorting Algorithms', slug: 'sorting', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Searching Algorithms', slug: 'searching', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Prefix Sum', slug: 'prefix-sum', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Dynamic Programming', slug: 'dynamic-programming', difficulty: 'advanced', category: 'algorithm' },
  { title: 'Backtracking', slug: 'backtracking', difficulty: 'advanced', category: 'algorithm' },
  { title: 'Greedy Algorithms', slug: 'greedy', difficulty: 'intermediate', category: 'algorithm' },
];

const topicRegistry: CatalogTopic[] = [
  { title: 'Arrays', slug: 'arrays', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Vectors (Dynamic Arrays)', slug: 'vectors', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Strings', slug: 'strings', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Linked Lists', slug: 'linked-lists', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Stacks', slug: 'stacks', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Queues', slug: 'queues', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Hash Maps & Hash Sets', slug: 'hash-maps', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Binary Trees', slug: 'trees', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Binary Search Trees', slug: 'bst', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Heaps', slug: 'heaps', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Graphs', slug: 'graphs', difficulty: 'intermediate', category: 'data-structure' },
  { title: 'Tries', slug: 'tries', difficulty: 'advanced', category: 'data-structure' },
  { title: 'Sliding Window', slug: 'sliding-window', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Two Pointers', slug: 'two-pointers', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Prefix Sum', slug: 'prefix-sum', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Binary Search Pattern', slug: 'binary-search', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Sorting Algorithms', slug: 'sorting', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Searching Algorithms', slug: 'searching', difficulty: 'beginner', category: 'algorithm' },
  { title: 'Recursion & Backtracking', slug: 'recursion', difficulty: 'advanced', category: 'algorithm' },
  { title: 'Dynamic Programming', slug: 'dynamic-programming', difficulty: 'advanced', category: 'algorithm' },
  { title: 'Greedy Algorithms', slug: 'greedy', difficulty: 'intermediate', category: 'algorithm' },
  { title: 'BFS & DFS', slug: 'bfs-dfs', difficulty: 'intermediate', category: 'algorithm' },
  { title: 'Stacks & Queues', slug: 'stacks-queues', difficulty: 'beginner', category: 'data-structure' },
  { title: 'Backtracking', slug: 'backtracking', difficulty: 'advanced', category: 'algorithm' },
  { title: 'Fast and Slow Pointers', slug: 'fast-and-slow-pointers', difficulty: 'intermediate', category: 'algorithm' },
];

const topicMap = new Map(topicRegistry.map((topic) => [topic.slug, topic]));

function filePathForSlug(slug: string) {
  return path.join(TOPICS_DIR, `${slug}.json`);
}

function readTopicJson(slug: string): LearningTopicPage | null {
  const filePath = filePathForSlug(slug);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LearningTopicPage;
}

function createPlaceholderTopic(slug: string): LearningTopicPage | null {
  const topic = topicMap.get(slug);
  if (!topic) {
    return null;
  }

  return {
    id: slug,
    slug,
    title: topic.title,
    category: topic.category,
    difficulty: topic.difficulty,
    estimatedMinutes: 25,
    prerequisites: [],
    tags: [slug, topic.category],
    overview: {
      summary: `${topic.title} will be expanded into a full visual DSAKarle lesson soon.`,
      learningObjectives: [
        `Understand the core intuition behind ${topic.title}.`,
        `Learn when ${topic.title} appears in interviews.`,
        `Return for the interactive stepper and quizzes once content is published.`,
      ],
      interviewRelevance: 'This topic is on the roadmap and the route is intentionally reserved now.',
    },
    practice: [],
    examples: [],
    conceptQuiz: [],
    recognitionQuiz: null,
    comingSoon: true,
  };
}

export function getCatalogTopics(category: 'data-structure' | 'algorithm') {
  return homeCatalogTopics.filter((topic) => topic.category === category);
}

export function getAllTopicSlugs(): string[] {
  return Array.from(new Set(topicRegistry.map((topic) => topic.slug))).sort();
}

export function getTopicBySlug(slug: string): LearningTopicPage | null {
  return readTopicJson(slug) || createPlaceholderTopic(slug);
}

export function getTopicMetaList(): TopicMeta[] {
  return getAllTopicSlugs()
    .map((slug) => getTopicBySlug(slug))
    .filter((topic): topic is LearningTopicPage => Boolean(topic))
    .map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      category: topic.category,
      difficulty: topic.difficulty,
      tags: topic.tags,
      overview: {
        summary: topic.overview.summary,
      },
    }));
}
