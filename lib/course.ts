import { LESSONS, getGroup } from '@/lib/curriculum';

export interface CourseTopic {
  slug: string
  title: string
  group: string
}

/** Every lesson in content/curriculum.json, in learning order. `group` is the group's display title. */
export const COURSE_TOPICS: CourseTopic[] = LESSONS.map((lesson) => ({
  slug: lesson.slug,
  title: lesson.title,
  group: getGroup(lesson.group)?.title ?? lesson.group,
}));

const COURSE_SLUGS = new Set(COURSE_TOPICS.map((topic) => topic.slug));

export function isCourseSlug(slug: string): boolean {
  return COURSE_SLUGS.has(slug);
}

/** Count completed lessons, ignoring slugs that aren't part of the curriculum. */
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
