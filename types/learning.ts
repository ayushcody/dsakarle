export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type CodeLanguage = 'python' | 'javascript' | 'java' | 'cpp'

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

export interface StepperStep {
  stepIndex: number
  diagramState: {
    left?: number
    right?: number
    windowStart?: number
    windowEnd?: number
    highlighted?: number[]
    comparing?: [number, number]
  }
  variables: Record<string, string | number>
  constraintValue?: number
  constraintMax?: number
  explanation: string
  activeLine: number
}

export interface StepperData {
  diagramType: string
  array?: Array<number | string>
  steps: StepperStep[]
  constraintLabel?: string
}

export interface VocabularyItem {
  term: string
  definition: string
}

export interface MemoryLayoutRow {
  label: string
  value: string
}

export interface OperationBlock {
  name: string
  description: string
  timeComplexity: string
  spaceComplexity: string
  code: Record<CodeLanguage, string>
  visualNote: string
}

export interface WorkedExample {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  leetcodeUrl: string
  problemStatement: string
  inputExample: string
  outputExample: string
  steps: string[]
  code: Record<CodeLanguage, string>
  timeComplexity: string
  spaceComplexity: string
  rationale?: string
}

export interface RecognitionQuizData {
  problemStatement: string
  correctPatternId: string
  distractors: string[]
  explanation: string
}

export interface ConceptQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface PracticeProblem {
  title: string
  url: string
  difficulty: 'easy' | 'medium' | 'hard'
  keyInsight: string
}

export interface LearningTopicPage extends TopicMeta {
  estimatedMinutes: number
  prerequisites: string[]
  overview: {
    summary: string
    learningObjectives: string[]
    interviewRelevance: string
  }
  realWorldHook?: {
    paragraphs: string[]
    ahaMoment: string
  }
  definition?: {
    technicalDefinition: string
    vocabulary: VocabularyItem[]
    keyProperties: string[]
  }
  mentalModel?: {
    metaphor: string[]
    clickSentence: string
    diagramType: string
    cells?: Array<number | string>
    diagramState?: StepperStep['diagramState']
  }
  structure?: {
    memoryDescription: string[]
    definitionCode: Record<CodeLanguage, string>
    memoryLayout: MemoryLayoutRow[]
  }
  stepper?: StepperData
  operations?: OperationBlock[]
  patternTemplate?: {
    pseudocode: string
    whenToUse: string
    timeComplexity: string
    spaceComplexity: string
  }
  recognitionQuiz?: RecognitionQuizData | null
  examples?: WorkedExample[]
  conceptQuiz?: ConceptQuestion[]
  practice?: PracticeProblem[]
  comingSoon?: boolean
}

export interface CourseStructureTopic {
  slug: string
  title: string
}

export interface CourseStructureGroup {
  title: string
  topics: CourseStructureTopic[]
}

export interface CourseStructure {
  groups: CourseStructureGroup[]
}

export interface ProgressData {
  completedSections: string[]
  quizScores: Record<string, { recognition: boolean; concept: number }>
  lastVisited: string
}
