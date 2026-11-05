import type { CodeRef, Scene, TracerId } from '@/lib/engine/types';

export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface TopicMeta {
  id: string
  slug: string
  title: string
  category: 'data-structure' | 'algorithm'
  difficulty: TopicDifficulty
  tags: string[]
  overview: {
    summary: string
  }
}

export interface ProgressData {
  completedSections: string[]
  quizScores: Record<string, { recognition: boolean; concept: number }>
  lastVisited: string
}

// ===========================================================================
// Lesson schema v2 — rendered by components/lesson/LessonPage when
// `schemaVersion: 2`. Title, glyph, difficulty, prerequisites and group come
// from content/curriculum.json and are NOT repeated here.
// See docs/CONTENT_GUIDE.md.
// ===========================================================================


export type ProblemDifficulty = 'easy' | 'medium' | 'hard'

export interface Callout {
  /** Same target syntax as scene annotations: `cell:2`, `node:n1`, `bucket:0`, `ptr:left`, `window`. */
  target: string
  /** ≤ 6 words, drawn in the handwritten callout font. */
  text: string
}

export interface StageTrack {
  /** Stable id, e.g. `fixed`. */
  id: string
  /** Track picker label, e.g. "Fixed-size window". */
  label: string
  tracer: TracerId
  /** Index into the tracer's presets used for the guided run. Defaults to 0. */
  preset?: number
  /** Which predict candidates to ask during the guided run. Omit for none. */
  predict?: { tags: string[]; max: number }
}

export interface RecognitionItem {
  /** A short problem statement, written like an interview prompt. */
  problem: string
  /** Curriculum slug of the right pattern. */
  answer: string
  /** 3–4 curriculum slugs including `answer`; rendered as glyph + title. */
  options: string[]
  explanation: string
}

export interface PseudocodeLine {
  text: string
  /** Links the line to a tracer anchor so it lights up in sync. */
  anchor?: string
  indent?: number
}

export interface ConceptQuestionV2 {
  question: string
  options: string[]
  /** Index into options. Vary it — the validator rejects lessons where one index dominates. */
  answer: number
  explanation: string
}

export interface WorkedExampleV2 {
  title: string
  difficulty: ProblemDifficulty
  /** https://leetcode.com/problems/<slug>/ */
  url: string
  problem: string
  input: string
  output: string
  /** 2–5 short reasoning steps. */
  approach: string[]
  code: CodeRef
  /** Optional tracer to replay this example in the stage. */
  tracer?: TracerId
  time: string
  space: string
}

export interface PracticeProblemV2 {
  title: string
  url: string
  difficulty: ProblemDifficulty
  /** One sentence: the key insight, without giving the full solution away. */
  insight: string
}

export interface LessonV2 {
  schemaVersion: 2
  slug: string
  /** A puzzle that makes the learner want the idea before they get it. */
  hook: { question: string; paragraphs: string[]; aha: string }
  /** The Picture: one static scene with handwritten callouts, shown above the fold. */
  shape: { scene: Scene; callouts: Callout[] }
  mentalModel: {
    metaphor: string[]
    /** The one sentence that makes it click. */
    click: string
    glossary: Array<{ term: string; definition: string }>
    /** Formal definition, folded away by default. */
    definition?: string
  }
  stage: { tracks: StageTrack[]; playground: boolean }
  recognise: { useWhen: string[]; notWhen: string[]; quiz: RecognitionItem[] }
  template: {
    pseudocode: PseudocodeLine[]
    /** Tracer whose code is shown in the Python / Java / C++ tabs with a synced replay. */
    tracer: TracerId
    time: string
    space: string
    notes?: string[]
  }
  examples: WorkedExampleV2[]
  conceptQuiz: ConceptQuestionV2[]
  practice: PracticeProblemV2[]
  /**
   * "Lesson overview": 4–6 short, verb-led outcomes ("Explain why…", "Trace…").
   * Shown near the top of the lesson, like a syllabus for the page.
   */
  overview?: string[]
  /** "Additional resources": 2–5 reputable external links, each verified to load. */
  resources?: LessonResource[]
}

export interface LessonResource {
  title: string
  /** https only. */
  url: string
  /** One sentence: why it's worth opening. */
  note: string
}

// ===========================================================================
// Curriculum — content/curriculum.json, read via lib/curriculum.ts
// ===========================================================================

export type CurriculumGroupId = 'data-structures' | 'algorithms'

/** One glyph per lesson; drawn by components/glyph/Glyph.tsx. */
export type GlyphId =
  | 'arrays' | 'vectors' | 'strings' | 'linked-lists' | 'stacks' | 'queues'
  | 'hash-maps' | 'trees' | 'bst' | 'heaps' | 'graphs' | 'tries'
  | 'sliding-window' | 'two-pointers' | 'fast-and-slow-pointers' | 'prefix-sum'
  | 'binary-search' | 'sorting' | 'searching' | 'recursion'
  | 'dynamic-programming' | 'greedy' | 'bfs-dfs'

export interface CurriculumLesson {
  slug: string
  title: string
  group: CurriculumGroupId
  glyph: GlyphId
  difficulty: TopicDifficulty
  /** `live` = v2 lesson that passes validation; `draft` = honestly labelled work in progress. */
  status: 'live' | 'draft'
  minutes: number
  /** ≤ 12 words: what it is, in plain English. */
  oneLiner: string
  /** The clue in a problem statement that says "use this". */
  trigger: string
  notThisWhen?: string
  prereqs: string[]
  related: string[]
}

export interface CurriculumGroup {
  id: CurriculumGroupId
  title: string
  blurb: string
}

/** A titled run of lessons inside a path, like a chapter. */
export interface CurriculumSection {
  title: string
  /** Lesson slugs in order. */
  lessons: string[]
}

/**
 * A path is the top of the information architecture (paths → sections → lessons).
 * Every lesson belongs to exactly one path; path order × section order × lesson
 * order must equal the order of `Curriculum.lessons`.
 */
export interface CurriculumPath {
  id: string
  title: string
  /** One or two sentences: who it's for and what you'll be able to do. */
  blurb: string
  glyph: GlyphId
  sections: CurriculumSection[]
}

export interface Curriculum {
  groups: CurriculumGroup[]
  paths: CurriculumPath[]
  /** In learning order. */
  lessons: CurriculumLesson[]
}
