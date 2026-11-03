import curriculumJson from '@/content/curriculum.json';
import type { Curriculum, CurriculumGroup, CurriculumGroupId, CurriculumLesson } from '@/types/learning';

/**
 * The single source of truth for which lessons exist, their order, titles,
 * glyphs, difficulty, status and relationships. Safe to import on server and client.
 */
export const CURRICULUM = curriculumJson as Curriculum;

export const LESSONS: readonly CurriculumLesson[] = CURRICULUM.lessons;

const bySlug = new Map(LESSONS.map((lesson, index) => [lesson.slug, { lesson, index }]));

export function getLessonMeta(slug: string): CurriculumLesson | undefined {
  return bySlug.get(slug)?.lesson;
}

export function isCurriculumSlug(slug: string): boolean {
  return bySlug.has(slug);
}

/** 1-based position in the whole course, e.g. 3 for "3 of 23". 0 if unknown. */
export function lessonNumber(slug: string): number {
  const entry = bySlug.get(slug);
  return entry ? entry.index + 1 : 0;
}

export function getGroup(id: CurriculumGroupId): CurriculumGroup | undefined {
  return CURRICULUM.groups.find((group) => group.id === id);
}

export function lessonsInGroup(id: CurriculumGroupId): CurriculumLesson[] {
  return LESSONS.filter((lesson) => lesson.group === id);
}

/** Previous and next lessons in learning order (across groups). */
export function getNeighbours(slug: string): { prev?: CurriculumLesson; next?: CurriculumLesson } {
  const entry = bySlug.get(slug);
  if (!entry) {
    return {};
  }
  return { prev: LESSONS[entry.index - 1], next: LESSONS[entry.index + 1] };
}

export function liveLessons(): CurriculumLesson[] {
  return LESSONS.filter((lesson) => lesson.status === 'live');
}
