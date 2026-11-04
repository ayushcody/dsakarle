import { LESSONS } from '@/lib/curriculum'
import { getTopicBySlug } from '@/lib/content'
import type { GlyphId, ProblemDifficulty } from '@/types/learning'

export interface PracticeItem {
  /** The LeetCode URL doubles as the id, and is what `dsakarle-solved` stores. */
  url: string
  title: string
  difficulty: ProblemDifficulty
  slug: string
  /** One-sentence hint from the lesson. Absent for worked examples. */
  insight: string | null
  /** True when the problem is solved step by step inside the lesson itself. */
  workedExample: boolean
}

export interface PracticeLesson {
  slug: string
  title: string
  glyph: GlyphId
  count: number
}

const DIFFICULTIES: readonly ProblemDifficulty[] = ['easy', 'medium', 'hard']

function asDifficulty(value: unknown): ProblemDifficulty {
  return DIFFICULTIES.includes(value as ProblemDifficulty) ? (value as ProblemDifficulty) : 'medium'
}

function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

interface RawProblem {
  title: string
  url: string
  difficulty: ProblemDifficulty
  insight: string | null
}

function practiceOf(slug: string): RawProblem[] {
  const lesson = getTopicBySlug(slug)
  if (!lesson) return []
  return (lesson.practice ?? []).flatMap((p) =>
    typeof p.title === 'string' && isUrl(p.url)
      ? [{ title: p.title, url: p.url, difficulty: asDifficulty(p.difficulty), insight: p.insight?.trim() || null }]
      : [],
  )
}

function examplesOf(slug: string): RawProblem[] {
  const lesson = getTopicBySlug(slug)
  if (!lesson) return []
  return lesson.examples.flatMap((e) =>
    typeof e.title === 'string' && isUrl(e.url)
      ? [{ title: e.title, url: e.url, difficulty: asDifficulty(e.difficulty), insight: null }]
      : [],
  )
}

/**
 * Every practice problem across the curriculum, deduped by URL, in learning order.
 * Curated practice problems win over worked examples; the first lesson to list a
 * problem keeps it.
 */
export function buildPracticeList(): { items: PracticeItem[]; lessons: PracticeLesson[] } {
  const seen = new Set<string>()
  const bySlug = new Map<string, PracticeItem[]>()

  const add = (slug: string, raw: RawProblem, workedExample: boolean) => {
    if (seen.has(raw.url)) return
    seen.add(raw.url)
    const list = bySlug.get(slug) ?? []
    list.push({ ...raw, slug, workedExample })
    bySlug.set(slug, list)
  }

  for (const lesson of LESSONS) practiceOf(lesson.slug).forEach((p) => add(lesson.slug, p, false))
  for (const lesson of LESSONS) examplesOf(lesson.slug).forEach((p) => add(lesson.slug, p, true))

  const items: PracticeItem[] = []
  const lessons: PracticeLesson[] = []
  for (const lesson of LESSONS) {
    const list = bySlug.get(lesson.slug)
    if (!list?.length) continue
    // Practice first, then worked examples, each keeping authored order.
    const ordered = [...list.filter((p) => !p.workedExample), ...list.filter((p) => p.workedExample)]
    items.push(...ordered)
    lessons.push({ slug: lesson.slug, title: lesson.title, glyph: lesson.glyph, count: ordered.length })
  }
  return { items, lessons }
}
