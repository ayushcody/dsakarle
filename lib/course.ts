import courseStructure from '@/content/course-structure.json';
import type { CourseStructure } from '@/types/learning';

const structure = courseStructure as CourseStructure;

export interface CourseTopic {
  slug: string
  title: string
  group: string
}

/** Every lesson in course-structure.json, in curriculum order. */
export const COURSE_TOPICS: CourseTopic[] = structure.groups.flatMap((group) =>
  group.topics.map((topic) => ({ slug: topic.slug, title: topic.title, group: group.title })),
);

const COURSE_SLUGS = new Set(COURSE_TOPICS.map((topic) => topic.slug));

export function isCourseSlug(slug: string): boolean {
  return COURSE_SLUGS.has(slug);
}

/** Count completed lessons, ignoring slugs that aren't part of the course structure. */
export function countCompletedLessons(completedSections: string[]): number {
  return new Set(completedSections.filter((slug) => COURSE_SLUGS.has(slug))).size;
}

export function getCourseProgressPercent(completedSections: string[]): number {
  if (COURSE_TOPICS.length === 0) {
    return 0;
  }
  const percent = Math.round((countCompletedLessons(completedSections) / COURSE_TOPICS.length) * 100);
  return Math.min(100, percent);
}
