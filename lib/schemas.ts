import { z } from 'zod';

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const languageSchema = z.enum(['python', 'javascript', 'java', 'cpp']);
export const blockTypeSchema = z.enum(['theory', 'diagram', 'stepper', 'callout', 'code', 'list', 'gauge']);
export const calloutTypeSchema = z.enum(['note', 'tip', 'warning', 'interview']);
export const categorySchema = z.enum(['data-structure', 'algorithm']);
export const exampleDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const diagramTypeSchema = z.enum(['array', 'linked-list', 'tree', 'graph']);

export const stepSchema = z.object({
  stepIndex: z.number(),
  diagramState: z.object({
    left: z.number(),
    right: z.number(),
    windowStart: z.number().optional(),
    windowEnd: z.number().optional(),
    highlighted: z.array(z.number()).optional(),
  }),
  variables: z.record(z.string(), z.union([z.string(), z.number()])),
  constraintValue: z.number().optional(),
  constraintMax: z.number().optional(),
  explanation: z.string(),
  activeLine: z.number(),
});

export const codeByLanguageSchema = z.object({
  python: z.string(),
  javascript: z.string(),
  java: z.string(),
  cpp: z.string(),
});

export const exampleSchema = z.object({
  title: z.string(),
  difficulty: exampleDifficultySchema,
  leetcodeUrl: z.string(),
  problemStatement: z.string(),
  inputExample: z.string(),
  outputExample: z.string(),
  steps: z.array(z.string()),
  code: codeByLanguageSchema,
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
});

export const recognitionQuizSchema = z
  .object({
    problemStatement: z.string(),
    correctPatternId: z.string(),
    distractors: z.array(z.string()),
    explanation: z.string(),
  })
  .nullable();

export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number(),
  explanation: z.string(),
});

export const practiceLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  difficulty: exampleDifficultySchema,
  patternTag: z.string(),
});

export const theoryContentBlockSchema = z.object({
  type: z.literal('theory'),
  content: z.string(),
});

export const diagramContentBlockSchema = z.object({
  type: z.literal('diagram'),
  id: z.string(),
});

export const stepperContentBlockSchema = z.object({
  type: z.literal('stepper'),
  steps: z.array(stepSchema),
  codeHtml: codeByLanguageSchema,
  diagramType: diagramTypeSchema.optional(),
  arrayCells: z.array(z.number()).optional(),
  constraintLabel: z.string().optional(),
});

export const calloutContentBlockSchema = z.object({
  type: z.literal('callout'),
  calloutType: calloutTypeSchema,
  title: z.string(),
  content: z.string(),
});

export const codeContentBlockSchema = z.object({
  type: z.literal('code'),
  language: languageSchema,
  code: z.string(),
});

export const listContentBlockSchema = z.object({
  type: z.literal('list'),
  items: z.array(z.string()),
});

export const gaugeContentBlockSchema = z.object({
  type: z.literal('gauge'),
  value: z.number(),
  max: z.number(),
  label: z.string(),
});

export const contentBlockSchema = z.discriminatedUnion('type', [
  theoryContentBlockSchema,
  diagramContentBlockSchema,
  stepperContentBlockSchema,
  calloutContentBlockSchema,
  codeContentBlockSchema,
  listContentBlockSchema,
  gaugeContentBlockSchema,
]);

export const topicPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: categorySchema,
  difficulty: difficultySchema,
  estimatedMinutes: z.number(),
  prerequisites: z.array(z.string()),
  tags: z.array(z.string()),
  overview: z.object({
    summary: z.string(),
    learningObjectives: z.array(z.string()),
    interviewRelevance: z.string(),
  }),
  content: z.array(contentBlockSchema),
  patternTemplate: z.object({
    pseudocode: z.string(),
    whenToUse: z.string(),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
  }),
  examples: z.array(exampleSchema),
  recognitionQuiz: recognitionQuizSchema,
  conceptQuiz: z.array(quizQuestionSchema),
  practice: z.array(practiceLinkSchema),
  isPlaceholder: z.boolean().optional(),
});
