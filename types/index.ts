export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type Language = 'python' | 'javascript' | 'java' | 'cpp'
export type BlockType = 'theory' | 'diagram' | 'stepper' | 'callout' | 'code' | 'list' | 'gauge'
export type CalloutType = 'note' | 'tip' | 'warning' | 'interview'
export type Category = 'data-structure' | 'algorithm'
export type ExampleDifficulty = 'easy' | 'medium' | 'hard'
export type DiagramType = 'array' | 'linked-list' | 'tree' | 'graph'

export interface TopicOverview {
  summary: string
  learningObjectives: string[]
  interviewRelevance: string
}

export interface TheoryContentBlock {
  type: 'theory'
  content: string
}

export interface DiagramContentBlock {
  type: 'diagram'
  id: string
}

export interface StepperContentBlock {
  type: 'stepper'
  steps: Step[]
  codeHtml: Record<Language, string>
  diagramType?: DiagramType
  arrayCells?: number[]
  constraintLabel?: string
}

export interface CalloutContentBlock {
  type: 'callout'
  calloutType: CalloutType
  title: string
  content: string
}

export interface CodeContentBlock {
  type: 'code'
  language: Language
  code: string
}

export interface ListContentBlock {
  type: 'list'
  items: string[]
}

export interface GaugeContentBlock {
  type: 'gauge'
  value: number
  max: number
  label: string
}

export type ContentBlock =
  | TheoryContentBlock
  | DiagramContentBlock
  | StepperContentBlock
  | CalloutContentBlock
  | CodeContentBlock
  | ListContentBlock
  | GaugeContentBlock

export interface CurriculumTopic {
  title: string
  slug: string
  difficulty: Difficulty
  category: Category
  catalogGroup?: Category
}

export interface TopicPage {
  id: string
  title: string
  slug: string
  category: Category
  difficulty: Difficulty
  estimatedMinutes: number
  prerequisites: string[]
  tags: string[]
  overview: TopicOverview
  content: ContentBlock[]
  patternTemplate: {
    pseudocode: string
    whenToUse: string
    timeComplexity: string
    spaceComplexity: string
  }
  examples: Example[]
  recognitionQuiz: RecognitionQuiz | null
  conceptQuiz: QuizQuestion[]
  practice: PracticeLink[]
  isPlaceholder?: boolean
}

export interface Step {
  stepIndex: number
  diagramState: {
    left: number
    right: number
    windowStart?: number
    windowEnd?: number
    highlighted?: number[]
  }
  variables: Record<string, string | number>
  constraintValue?: number
  constraintMax?: number
  explanation: string
  activeLine: number
}

export interface Example {
  title: string
  difficulty: ExampleDifficulty
  leetcodeUrl: string
  problemStatement: string
  inputExample: string
  outputExample: string
  steps: string[]
  code: Record<Language, string>
  timeComplexity: string
  spaceComplexity: string
}

export interface RecognitionQuiz {
  problemStatement: string
  correctPatternId: string
  distractors: string[]
  explanation: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface PracticeLink {
  title: string
  url: string
  difficulty: ExampleDifficulty
  patternTag: string
}
