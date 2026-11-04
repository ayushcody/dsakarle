import fs from 'fs';
import path from 'path';

import { LESSONS, isCurriculumSlug } from '@/lib/curriculum';
import type { LessonV2 } from '@/types/learning';

const TOPICS_DIR = path.join(process.cwd(), 'content', 'topics');

/** Curriculum slugs in learning order. */
export function getAllTopicSlugs(): string[] {
  return LESSONS.map((lesson) => lesson.slug);
}

/**
 * Reads content/topics/<slug>.json for a curriculum lesson. Returns null when the slug is not
 * in the curriculum, the file is missing, or the file is not `schemaVersion: 2`.
 */
export function getTopicBySlug(slug: string): LessonV2 | null {
  if (!isCurriculumSlug(slug)) {
    return null;
  }

  const filePath = path.join(TOPICS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lesson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LessonV2;
  return lesson.schemaVersion === 2 ? lesson : null;
}
