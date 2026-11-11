import { getAllTopicSlugs, getTopicBySlug } from '@/lib/content'
import { type GymItem, itemsFromLesson } from '@/lib/gym'

/** Every recognition item from every lesson, in curriculum order. Server only (reads content/topics). */
export function loadGymItems(): GymItem[] {
  return getAllTopicSlugs().flatMap((slug) => itemsFromLesson(slug, getTopicBySlug(slug)))
}
