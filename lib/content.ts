import fs from 'fs';
import path from 'path';

import { LESSONS, isCurriculumSlug } from '@/lib/curriculum';
import type { CurriculumGroupId, LearningTopicPage, TopicDifficulty, TopicMeta } from '@/types/learning';

export type CatalogCategory = 'data-structure' | 'algorithm';

export interface CatalogTopic {
  title: string
  slug: string
  difficulty: TopicDifficulty
  category: CatalogCategory
}

const CATEGORY_BY_GROUP: Record<CurriculumGroupId, CatalogCategory> = {
  'data-structures': 'data-structure',
  algorithms: 'algorithm',
};

const TOPICS_DIR = path.join(process.cwd(), 'content', 'topics');

/** Every curriculum lesson, in learning order. Derived from content/curriculum.json only. */
const topicRegistry: CatalogTopic[] = LESSONS.map((lesson) => ({
  title: lesson.title,
  slug: lesson.slug,
  difficulty: lesson.difficulty,
  category: CATEGORY_BY_GROUP[lesson.group],
}));

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

export function getCatalogTopics(category: CatalogCategory): CatalogTopic[] {
  return topicRegistry.filter((topic) => topic.category === category);
}

/** Curriculum slugs in learning order. */
export function getAllTopicSlugs(): string[] {
  return topicRegistry.map((topic) => topic.slug);
}

/**
 * Reads content/topics/<slug>.json when present, otherwise a placeholder for curriculum lessons.
 * Returns null for any slug that is not in the curriculum.
 */
export function getTopicBySlug(slug: string): LearningTopicPage | null {
  if (!isCurriculumSlug(slug)) {
    return null;
  }

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
