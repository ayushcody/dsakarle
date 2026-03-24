import fs from 'fs';
import path from 'path';

import { topicPageSchema } from '@/lib/schemas';
import type { CurriculumTopic, TopicPage } from '@/types';

const TOPICS_DIR = path.join(process.cwd(), 'content', 'topics');

export const curriculumTopics: CurriculumTopic[] = [
  { title: 'Arrays & Vectors', slug: 'arrays', difficulty: 'beginner', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Linked Lists', slug: 'linked-lists', difficulty: 'beginner', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Stacks & Queues', slug: 'stacks-queues', difficulty: 'beginner', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Binary Trees', slug: 'trees', difficulty: 'intermediate', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Graphs', slug: 'graphs', difficulty: 'intermediate', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Heaps', slug: 'heaps', difficulty: 'intermediate', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Tries', slug: 'tries', difficulty: 'advanced', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Hash Maps', slug: 'hash-maps', difficulty: 'intermediate', category: 'data-structure', catalogGroup: 'data-structure' },
  { title: 'Sliding Window', slug: 'sliding-window', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Two Pointers', slug: 'two-pointers', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Binary Search', slug: 'binary-search', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Sorting Algorithms', slug: 'sorting', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Searching Algorithms', slug: 'searching', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Prefix Sum', slug: 'prefix-sum', difficulty: 'beginner', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Dynamic Programming', slug: 'dynamic-programming', difficulty: 'advanced', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Backtracking', slug: 'backtracking', difficulty: 'advanced', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Greedy Algorithms', slug: 'greedy', difficulty: 'intermediate', category: 'algorithm', catalogGroup: 'algorithm' },
  { title: 'Fast and Slow Pointers', slug: 'fast-and-slow-pointers', difficulty: 'intermediate', category: 'algorithm' },
];

const topicLookup = new Map(curriculumTopics.map((topic) => [topic.slug, topic]));

function readTopicFileSlugs(): string[] {
  if (!fs.existsSync(TOPICS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(TOPICS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

function createPlaceholderTopic(slug: string): TopicPage | null {
  const topic = topicLookup.get(slug);

  if (!topic) {
    return null;
  }

  return {
    id: topic.slug,
    title: topic.title,
    slug: topic.slug,
    category: topic.category,
    difficulty: topic.difficulty,
    estimatedMinutes: 25,
    prerequisites: [],
    tags: [topic.title.toLowerCase(), topic.category],
    overview: {
      summary: `${topic.title} is part of the DSAKarle curriculum. The full guided lesson for this topic is still being authored.`,
      learningObjectives: [
        `Recognize where ${topic.title} appears in interviews.`,
        `Understand the core intuition behind ${topic.title}.`,
        'Return here once the full interactive walkthrough is published.',
      ],
      interviewRelevance: 'This topic is on the roadmap and will be expanded into a full visual lesson.',
    },
    content: [],
    patternTemplate: {
      pseudocode: 'Full topic template coming soon.',
      whenToUse: 'This topic page is being prepared.',
      timeComplexity: 'Varies by problem',
      spaceComplexity: 'Varies by problem',
    },
    examples: [],
    recognitionQuiz: null,
    conceptQuiz: [],
    practice: [],
    isPlaceholder: true,
  };
}

export function getCatalogTopics(category: CurriculumTopic['catalogGroup']): CurriculumTopic[] {
  return curriculumTopics.filter((topic) => topic.catalogGroup === category);
}

export function getKnownTopicSlugs(): string[] {
  return Array.from(new Set([...curriculumTopics.map((topic) => topic.slug), ...readTopicFileSlugs()])).sort();
}

export function getTopicBySlug(slug: string): TopicPage | null {
  const filePath = path.join(TOPICS_DIR, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return createPlaceholderTopic(slug);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsedJson = JSON.parse(fileContents);
  const result = topicPageSchema.safeParse(parsedJson);

  if (!result.success) {
    throw new Error(`Invalid topic content for "${slug}": ${result.error.message}`);
  }

  return result.data;
}
