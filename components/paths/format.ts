import { pathLessons } from '@/lib/curriculum';

export function pathMinutes(id: string): number {
  return pathLessons(id).reduce((sum, lesson) => sum + lesson.minutes, 0);
}

export function lessonWord(n: number): string {
  return n === 1 ? 'lesson' : 'lessons';
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
