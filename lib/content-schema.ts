/**
 * Content validation: zod schemas mirroring the lesson / curriculum types and
 * pure rule functions. No filesystem access here, so tests can call every rule
 * directly; scripts/validate-content.ts does the loading.
 *
 * Severity: issues in a lesson whose curriculum status is `live` are errors
 * (the build fails); issues in `draft` lessons are warnings. Curriculum-level
 * structural problems are always errors.
 *
 * Relative imports only so this file runs under tsx, vitest and Next alike.
 */
import { z } from 'zod';
import { CODE_EXT, LANGS } from './engine/types';
import type { CodeRef, Lang, ParsedCode, TracerId } from './engine/types';
import { parseCode, parseCodeAnyLang } from './code/anchors';
import type { Curriculum, CurriculumLesson, LessonV2 } from '../types/learning';

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export interface Issue {
  slug: string
  path: string
  rule: string
  message: string
}

/** Slug used for problems that belong to the curriculum itself, not one lesson. */
export const CURRICULUM_SLUG = '(curriculum)';

// ---------------------------------------------------------------------------
// Zod schemas — LessonV2
// ---------------------------------------------------------------------------

const text = z.string().trim().min(1);
const textList = z.array(text);

const REF_RE = /^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/;
const tracerIdSchema = z.custom<TracerId>(
  (value) => typeof value === 'string' && REF_RE.test(value),
  { message: 'Expected `<topic-slug>/<name>`, e.g. sliding-window/max-sum-k' },
);
const codeRefSchema = z.custom<CodeRef>(
  (value) => typeof value === 'string' && REF_RE.test(value),
  { message: 'Expected `<topic-slug>/<name>`, e.g. sliding-window/max-sum-k' },
);

const pointerRoleSchema = z.enum(['ptrA', 'ptrB', 'focus']);
const markRoleSchema = z.enum(['focus', 'compare', 'visited', 'discarded', 'changed', 'found', 'error']);
const annotationSchema = z.object({ target: z.string(), text: z.string() }).strict();
const cellValue = z.union([z.number(), z.string(), z.null()]);
const scalar = z.union([z.number(), z.string()]);

const arraySceneSchema = z.object({
  kind: z.literal('array'),
  label: z.string().optional(),
  cells: z.array(cellValue),
  pointers: z.array(z.object({ name: z.string(), index: z.number(), role: pointerRoleSchema }).strict()).optional(),
  window: z.object({ start: z.number(), end: z.number() }).strict().nullable().optional(),
  marks: z.array(z.object({ index: z.number(), role: markRoleSchema }).strict()).optional(),
  addresses: z.object({ base: z.number(), size: z.number() }).strict().optional(),
  capacity: z.number().optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const linkedListSceneSchema = z.object({
  kind: z.literal('linked-list'),
  nodes: z.array(z.object({ id: z.string(), value: scalar }).strict()),
  links: z.array(z.object({
    from: z.string(),
    to: z.string().nullable(),
    role: z.enum(['focus', 'changed', 'error']).optional(),
  }).strict()),
  floating: z.array(z.string()).optional(),
  pointers: z.array(z.object({ name: z.string(), target: z.string().nullable(), role: pointerRoleSchema }).strict()).optional(),
  marks: z.array(z.object({ id: z.string(), role: markRoleSchema }).strict()).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const hashMapSceneSchema = z.object({
  kind: z.literal('hash-map'),
  buckets: z.array(z.array(z.object({ key: scalar, value: scalar.optional() }).strict())),
  hashing: z.object({ key: scalar, hash: z.number(), bucket: z.number() }).strict().nullable().optional(),
  marks: z.array(z.object({ bucket: z.number(), slot: z.number().optional(), role: markRoleSchema }).strict()).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const ptrToNode = z.object({ name: z.string(), target: z.string().nullable(), role: pointerRoleSchema }).strict();
const idMark = z.object({ id: z.string(), role: markRoleSchema }).strict();
const edgeRole = z.enum(['focus', 'visited', 'changed', 'found', 'error']);

const stackSceneSchema = z.object({
  kind: z.literal('stack'),
  label: z.string().optional(),
  items: z.array(scalar),
  capacity: z.number().optional(),
  marks: z.array(z.object({ index: z.number(), role: markRoleSchema }).strict()).optional(),
  incoming: z.object({ value: scalar, direction: z.enum(['push', 'pop']) }).strict().nullable().optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const treeSceneSchema = z.object({
  kind: z.literal('tree'),
  root: z.string().nullable(),
  nodes: z.array(z.object({
    id: z.string(),
    value: scalar,
    children: z.array(z.string().nullable()),
    edgeLabels: z.array(z.string().nullable()).optional(),
    terminal: z.boolean().optional(),
  }).strict()),
  pointers: z.array(ptrToNode).optional(),
  marks: z.array(idMark).optional(),
  edgeMarks: z.array(z.object({ from: z.string(), to: z.string(), role: edgeRole }).strict()).optional(),
  floating: z.array(z.string()).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const graphSceneSchema = z.object({
  kind: z.literal('graph'),
  directed: z.boolean(),
  nodes: z.array(z.object({ id: z.string(), label: z.string(), at: z.object({ col: z.number(), row: z.number() }).strict() }).strict()),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    weight: z.number().optional(),
    role: z.enum(['focus', 'visited', 'changed', 'found', 'error', 'discarded']).optional(),
  }).strict()),
  marks: z.array(idMark).optional(),
  pointers: z.array(ptrToNode).optional(),
  badges: z.array(z.object({ id: z.string(), text: z.string() }).strict()).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const gridSceneSchema = z.object({
  kind: z.literal('grid'),
  label: z.string().optional(),
  rows: z.array(z.array(cellValue)),
  rowLabels: z.array(z.string()).optional(),
  colLabels: z.array(z.string()).optional(),
  marks: z.array(z.object({ r: z.number(), c: z.number(), role: markRoleSchema }).strict()).optional(),
  pointers: z.array(z.object({ name: z.string(), r: z.number(), c: z.number(), role: pointerRoleSchema }).strict()).optional(),
  arrows: z.array(z.object({ from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) }).strict()).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const callTreeSceneSchema = z.object({
  kind: z.literal('call-tree'),
  calls: z.array(z.object({
    id: z.string(),
    label: z.string(),
    parent: z.string().nullable(),
    status: z.enum(['pending', 'active', 'returned', 'pruned']),
    result: z.string().optional(),
  }).strict()),
  stack: z.array(z.string()),
  marks: z.array(idMark).optional(),
  annotations: z.array(annotationSchema).optional(),
}).strict();

const simpleSceneSchema = z.discriminatedUnion('kind', [
  arraySceneSchema,
  linkedListSceneSchema,
  hashMapSceneSchema,
  stackSceneSchema,
  treeSceneSchema,
  graphSceneSchema,
  gridSceneSchema,
  callTreeSceneSchema,
]);

const compositeSceneSchema = z.object({
  kind: z.literal('composite'),
  layout: z.enum(['row', 'column']),
  parts: z.array(z.object({ title: z.string().optional(), scene: simpleSceneSchema }).strict()),
}).strict();

export const sceneSchema = z.discriminatedUnion('kind', [
  arraySceneSchema,
  linkedListSceneSchema,
  hashMapSceneSchema,
  stackSceneSchema,
  treeSceneSchema,
  graphSceneSchema,
  gridSceneSchema,
  callTreeSceneSchema,
  compositeSceneSchema,
]);

export const problemDifficultySchema = z.enum(['easy', 'medium', 'hard']);

const calloutSchema = z.object({ target: text, text }).strict();

const stageTrackSchema = z.object({
  id: text,
  label: text,
  tracer: tracerIdSchema,
  preset: z.number().int().nonnegative().optional(),
  predict: z.object({ tags: textList, max: z.number().int().positive() }).strict().optional(),
}).strict();

const recognitionItemSchema = z.object({
  problem: text,
  answer: text,
  options: z.array(text).min(2),
  explanation: text,
}).strict();

const pseudocodeLineSchema = z.object({
  text: z.string(),
  anchor: text.optional(),
  indent: z.number().int().nonnegative().optional(),
}).strict();

const conceptQuestionV2Schema = z.object({
  question: text,
  options: z.array(text).min(2),
  answer: z.number().int().nonnegative(),
  explanation: text,
}).strict();

const workedExampleV2Schema = z.object({
  title: text,
  difficulty: problemDifficultySchema,
  url: z.string(),
  problem: text,
  input: z.string(),
  output: z.string(),
  approach: textList.min(1),
  code: codeRefSchema,
  tracer: tracerIdSchema.optional(),
  time: text,
  space: text,
}).strict();

const practiceProblemV2Schema = z.object({
  title: text,
  url: z.string(),
  difficulty: problemDifficultySchema,
  insight: text,
}).strict();

export const lessonV2Schema = z.object({
  schemaVersion: z.literal(2),
  slug: text,
  hook: z.object({ question: text, paragraphs: textList.min(1), aha: text }).strict(),
  shape: z.object({ scene: sceneSchema, callouts: z.array(calloutSchema).min(1) }).strict(),
  mentalModel: z.object({
    metaphor: textList.min(1),
    click: text,
    glossary: z.array(z.object({ term: text, definition: text }).strict()),
    definition: z.string().optional(),
  }).strict(),
  stage: z.object({ tracks: z.array(stageTrackSchema).min(1), playground: z.boolean() }).strict(),
  recognise: z.object({
    useWhen: textList.min(1),
    notWhen: textList,
    quiz: z.array(recognitionItemSchema).min(1),
  }).strict(),
  template: z.object({
    pseudocode: z.array(pseudocodeLineSchema).min(1),
    tracer: tracerIdSchema,
    time: text,
    space: text,
    notes: textList.optional(),
  }).strict(),
  examples: z.array(workedExampleV2Schema).min(1),
  conceptQuiz: z.array(conceptQuestionV2Schema).min(1),
  practice: z.array(practiceProblemV2Schema).min(1),
}).strict();

// ---------------------------------------------------------------------------
// Zod schemas — Curriculum
// ---------------------------------------------------------------------------

const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
const groupIdSchema = z.enum(['data-structures', 'algorithms']);
const glyphIdSchema = z.enum([
  'arrays', 'vectors', 'strings', 'linked-lists', 'stacks', 'queues',
  'hash-maps', 'trees', 'bst', 'heaps', 'graphs', 'tries',
  'sliding-window', 'two-pointers', 'fast-and-slow-pointers', 'prefix-sum',
  'binary-search', 'sorting', 'searching', 'recursion',
  'dynamic-programming', 'greedy', 'bfs-dfs',
]);

export const curriculumSchema = z.object({
  groups: z.array(z.object({ id: groupIdSchema, title: text, blurb: text }).strict()),
  lessons: z.array(z.object({
    slug: text,
    title: text,
    group: groupIdSchema,
    glyph: glyphIdSchema,
    difficulty: difficultySchema,
    status: z.enum(['live', 'draft']),
    minutes: z.number().positive(),
    oneLiner: text,
    trigger: text,
    notThisWhen: z.string().optional(),
    prereqs: z.array(z.string()),
    related: z.array(z.string()),
  }).strict()),
}).strict();

// ---------------------------------------------------------------------------
// Compile-time drift checks: schema output and the TS types must be mutually
// assignable. If types/learning.ts or lib/engine/types.ts change shape, tsc
// fails here until the schemas above are updated.
// ---------------------------------------------------------------------------

type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const lessonV2InSync: Mutual<z.infer<typeof lessonV2Schema>, LessonV2> = true;
const curriculumInSync: Mutual<z.infer<typeof curriculumSchema>, Curriculum> = true;
void lessonV2InSync;
void curriculumInSync;

// ---------------------------------------------------------------------------
// Zod schema — v1 `LearningTopicPage`, loosely. Only what the rules read;
// everything else passes through untouched.
// ---------------------------------------------------------------------------

const looseCode = z.record(z.string()).nullish();

export const lessonV1LooseSchema = z.object({
  slug: z.string().nullish(),
  difficulty: z.string().nullish(),
  comingSoon: z.boolean().nullish(),
  stepper: z.object({
    steps: z.array(z.object({ activeLine: z.number().nullish() }).passthrough()).nullish(),
  }).passthrough().nullish(),
  operations: z.array(z.object({ code: looseCode }).passthrough()).nullish(),
  examples: z.array(z.object({
    difficulty: z.string().nullish(),
    leetcodeUrl: z.string().nullish(),
    code: looseCode,
  }).passthrough()).nullish(),
  conceptQuiz: z.array(z.object({
    options: z.array(z.string()).nullish(),
    correctIndex: z.number().nullish(),
  }).passthrough()).nullish(),
  practice: z.array(z.object({
    url: z.string().nullish(),
    difficulty: z.string().nullish(),
  }).passthrough()).nullish(),
}).passthrough();

export type LessonV1Loose = z.infer<typeof lessonV1LooseSchema>;

export type ParsedLesson =
  | { version: 1; data: LessonV1Loose }
  | { version: 2; data: LessonV2 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_SCHEMA_ISSUES = 12;

function formatPath(path: ReadonlyArray<string | number>): string {
  let out = '';
  for (const part of path) {
    out += typeof part === 'number' ? `[${part}]` : out ? `.${part}` : part;
  }
  return out;
}

function zodToIssues(slug: string, error: z.ZodError, rule = 'schema', prefix = ''): Issue[] {
  const flat: Issue[] = [];
  const visit = (issue: z.ZodIssue, base: Array<string | number>): void => {
    if (issue.code === 'invalid_union') {
      // Report the closest branch rather than every branch.
      const best = [...issue.unionErrors].sort((a, b) => a.issues.length - b.issues.length)[0];
      if (best) {
        for (const inner of best.issues) visit(inner, base);
        return;
      }
    }
    flat.push({
      slug,
      path: prefix + formatPath([...base, ...issue.path]),
      rule,
      message: issue.message,
    });
  };
  for (const issue of error.issues) visit(issue, []);
  if (flat.length > MAX_SCHEMA_ISSUES) {
    const extra = flat.length - MAX_SCHEMA_ISSUES;
    const head = flat.slice(0, MAX_SCHEMA_ISSUES);
    head.push({ slug, path: '', rule, message: `...and ${extra} more schema issue${extra === 1 ? '' : 's'}` });
    return head;
  }
  return flat;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function lineCount(source: string): number {
  const trimmed = source.replace(/\s+$/, '');
  return trimmed === '' ? 0 : trimmed.split('\n').length;
}

// ---------------------------------------------------------------------------
// Code files + anchors
// ---------------------------------------------------------------------------

/**
 * Parse trailing `# @id` / `// @id` markers (single parser: lib/code/anchors.ts).
 * With a language it uses that language's comment marker; without, either.
 */
export function parseAnchors(source: string, lang?: Lang): ParsedCode {
  return lang ? parseCode(source, lang) : parseCodeAnyLang(source);
}

function codeFilePath(ref: string, lang: Lang): string {
  return `${ref}.${CODE_EXT[lang]}`;
}

interface RefUse {
  ref: string
  path: string
}

/** Every CodeRef a v2 lesson points at: template.tracer, examples[].code, stage.tracks[].tracer. */
export function collectCodeRefs(lesson: LessonV2): RefUse[] {
  const uses: RefUse[] = [{ ref: lesson.template.tracer, path: 'template.tracer' }];
  lesson.examples.forEach((example, i) => uses.push({ ref: example.code, path: `examples[${i}].code` }));
  lesson.stage.tracks.forEach((track, i) => uses.push({ ref: track.tracer, path: `stage.tracks[${i}].tracer` }));
  return uses;
}

// ---------------------------------------------------------------------------
// Rule 1 — curriculum
// ---------------------------------------------------------------------------

/**
 * Cross-checks on an already schema-valid curriculum: unique slugs, known
 * group ids, prereqs/related exist, topic files exist both ways.
 */
export function checkCurriculum(curriculum: Curriculum, topicSlugs: readonly string[]): Issue[] {
  const issues: Issue[] = [];
  const push = (path: string, rule: string, message: string): void => {
    issues.push({ slug: CURRICULUM_SLUG, path, rule, message });
  };

  const seen = new Set<string>();
  curriculum.lessons.forEach((lesson, i) => {
    if (seen.has(lesson.slug)) push(`lessons[${i}].slug`, 'curriculum-unique-slug', `Duplicate slug "${lesson.slug}".`);
    seen.add(lesson.slug);
  });

  const groupIds = new Set(curriculum.groups.map((group) => group.id));
  const topics = new Set(topicSlugs);

  curriculum.lessons.forEach((lesson, i) => {
    if (!groupIds.has(lesson.group)) {
      push(`lessons[${i}].group`, 'curriculum-group', `${lesson.slug}: group "${lesson.group}" is not in groups[].`);
    }
    for (const field of ['prereqs', 'related'] as const) {
      lesson[field].forEach((target, j) => {
        if (!seen.has(target)) {
          push(`lessons[${i}].${field}[${j}]`, 'curriculum-ref', `${lesson.slug}: ${field} "${target}" is not a curriculum slug.`);
        }
      });
    }
    if (!topics.has(lesson.slug)) {
      push(`lessons[${i}].slug`, 'curriculum-missing-file', `${lesson.slug}: content/topics/${lesson.slug}.json does not exist.`);
    }
  });

  for (const slug of topicSlugs) {
    if (!seen.has(slug)) {
      issues.push({
        slug,
        path: `content/topics/${slug}.json`,
        rule: 'orphan-file',
        message: `content/topics/${slug}.json has no entry in content/curriculum.json.`,
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 2 — live lessons are v2 and pass the schema
// ---------------------------------------------------------------------------

export type ParseOutcome =
  | { ok: true; parsed: ParsedLesson }
  | { ok: false; issues: Issue[] }

/** Detects the schema version and parses with the matching schema (v1 loosely). */
export function parseLesson(slug: string, lesson: unknown): ParseOutcome {
  if (!isRecord(lesson)) {
    return { ok: false, issues: [{ slug, path: '', rule: 'schema', message: 'Lesson file is not a JSON object.' }] };
  }
  if (lesson.schemaVersion === 2) {
    const result = lessonV2Schema.safeParse(lesson);
    return result.success
      ? { ok: true, parsed: { version: 2, data: result.data } }
      : { ok: false, issues: zodToIssues(slug, result.error) };
  }
  const result = lessonV1LooseSchema.safeParse(lesson);
  return result.success
    ? { ok: true, parsed: { version: 1, data: result.data } }
    : { ok: false, issues: zodToIssues(slug, result.error, 'schema-v1') };
}

/** Rule 2: what a `live` lesson must additionally satisfy. Run on the raw lesson. */
export function checkLiveRequirements(slug: string, lesson: unknown): Issue[] {
  if (!isRecord(lesson) || lesson.schemaVersion !== 2) {
    return [{ slug, path: 'schemaVersion', rule: 'live-schema-version', message: 'A live lesson must have `schemaVersion: 2`.' }];
  }
  const outcome = parseLesson(slug, lesson);
  if (!outcome.ok) return outcome.issues;
  const data = outcome.parsed.data as LessonV2;
  if (data.slug !== slug) {
    return [{ slug, path: 'slug', rule: 'slug-mismatch', message: `Lesson slug "${data.slug}" does not match its file/curriculum slug "${slug}".` }];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Rule 3 — code present in all three languages
// ---------------------------------------------------------------------------

const V1_LANGS: readonly Lang[] = LANGS;

export function checkCode(slug: string, parsed: ParsedLesson, codeFiles: Record<string, string>): Issue[] {
  const issues: Issue[] = [];
  if (parsed.version === 1) {
    const check = (code: Record<string, string> | null | undefined, path: string): void => {
      for (const lang of V1_LANGS) {
        if (!isNonEmpty(code?.[lang])) {
          issues.push({ slug, path: `${path}.${lang}`, rule: 'code-missing', message: `Missing or empty ${lang} code.` });
        }
      }
    };
    parsed.data.operations?.forEach((op, i) => check(op.code, `operations[${i}].code`));
    parsed.data.examples?.forEach((ex, i) => check(ex.code, `examples[${i}].code`));
    return issues;
  }

  const reported = new Set<string>();
  for (const { ref, path } of collectCodeRefs(parsed.data)) {
    for (const lang of LANGS) {
      const file = codeFilePath(ref, lang);
      if (reported.has(file)) continue;
      const source = codeFiles[file];
      if (source === undefined) {
        reported.add(file);
        issues.push({ slug, path, rule: 'code-missing', message: `content/code/${file} does not exist.` });
      } else if (!isNonEmpty(source)) {
        reported.add(file);
        issues.push({ slug, path, rule: 'code-missing', message: `content/code/${file} is empty.` });
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 4 — anchors line up across languages and with the pseudocode (v2)
// ---------------------------------------------------------------------------

export function checkAnchors(slug: string, parsed: ParsedLesson, codeFiles: Record<string, string>): Issue[] {
  if (parsed.version !== 2) return [];
  const issues: Issue[] = [];
  const lesson = parsed.data;

  const anchorSets = (ref: string): Record<Lang, Set<string> | null> => {
    const out = {} as Record<Lang, Set<string> | null>;
    for (const lang of LANGS) {
      const source = codeFiles[codeFilePath(ref, lang)];
      out[lang] = source && isNonEmpty(source) ? new Set(Object.keys(parseAnchors(source, lang).anchors)) : null;
    }
    return out;
  };

  const done = new Set<string>();
  for (const { ref, path } of collectCodeRefs(lesson)) {
    if (done.has(ref)) continue;
    done.add(ref);
    const sets = anchorSets(ref);
    const present = LANGS.filter((lang) => sets[lang] !== null);
    const union = new Set<string>();
    for (const lang of present) sets[lang]!.forEach((id) => union.add(id));
    for (const id of Array.from(union).sort()) {
      const missing = present.filter((lang) => !sets[lang]!.has(id));
      if (missing.length > 0) {
        issues.push({
          slug,
          path,
          rule: 'anchor-mismatch',
          message: `${ref}: anchor @${id} is missing in ${missing.join(', ')}.`,
        });
      }
    }
  }

  const templateSets = anchorSets(lesson.template.tracer);
  lesson.template.pseudocode.forEach((line, i) => {
    if (!line.anchor) return;
    const missing = LANGS.filter((lang) => templateSets[lang] !== null && !templateSets[lang]!.has(line.anchor!));
    if (missing.length > 0) {
      issues.push({
        slug,
        path: `template.pseudocode[${i}].anchor`,
        rule: 'pseudocode-anchor',
        message: `Anchor @${line.anchor} is not in ${lesson.template.tracer} (${missing.join(', ')}).`,
      });
    }
  });
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 5 — stepper active lines (v1)
// ---------------------------------------------------------------------------

export function checkStepperLines(slug: string, parsed: ParsedLesson): Issue[] {
  if (parsed.version !== 1) return [];
  const steps = parsed.data.stepper?.steps;
  if (!steps || steps.length === 0) return [];
  const python = parsed.data.examples?.[0]?.code?.python;
  if (!isNonEmpty(python)) {
    return [{
      slug,
      path: 'stepper',
      rule: 'stepper-lines',
      message: 'Stepper has steps but examples[0].code.python is missing, so activeLine cannot be checked.',
    }];
  }
  const total = lineCount(python as string);
  const issues: Issue[] = [];
  steps.forEach((step, i) => {
    const line = step.activeLine;
    if (typeof line !== 'number' || !Number.isInteger(line) || line < 1 || line > total) {
      issues.push({
        slug,
        path: `stepper.steps[${i}].activeLine`,
        rule: 'stepper-lines',
        message: `activeLine ${String(line)} is outside 1..${total} of examples[0].code.python.`,
      });
    }
  });
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 6 — quiz answer range and skew
// ---------------------------------------------------------------------------

export const QUIZ_SKEW_LIMIT = 0.6;
export const QUIZ_SKEW_MIN_QUESTIONS = 3;

export function checkQuiz(slug: string, parsed: ParsedLesson): Issue[] {
  const questions: Array<{ options: readonly string[] | null | undefined; answer: number | null | undefined }> =
    parsed.version === 1
      ? (parsed.data.conceptQuiz ?? []).map((q) => ({ options: q.options, answer: q.correctIndex }))
      : parsed.data.conceptQuiz.map((q) => ({ options: q.options, answer: q.answer }));
  const field = parsed.version === 1 ? 'correctIndex' : 'answer';

  const issues: Issue[] = [];
  const counts = new Map<number, number>();
  questions.forEach((q, i) => {
    const answer = q.answer;
    const size = q.options?.length ?? 0;
    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer >= size) {
      issues.push({
        slug,
        path: `conceptQuiz[${i}].${field}`,
        rule: 'quiz-range',
        message: `${field} ${String(answer)} is not a valid index into ${size} options.`,
      });
      return;
    }
    counts.set(answer, (counts.get(answer) ?? 0) + 1);
  });

  if (questions.length >= QUIZ_SKEW_MIN_QUESTIONS) {
    for (const [index, count] of Array.from(counts)) {
      if (count / questions.length > QUIZ_SKEW_LIMIT) {
        issues.push({
          slug,
          path: 'conceptQuiz',
          rule: 'quiz-skew',
          message: `Answer index ${index} is correct in ${count} of ${questions.length} questions (limit ${Math.round(QUIZ_SKEW_LIMIT * 100)}%). Vary the answer position.`,
        });
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 7 — difficulty vocab
// ---------------------------------------------------------------------------

const TOPIC_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const PROBLEM_DIFFICULTIES = ['easy', 'medium', 'hard'];

/** v1 only: v2 uses enums in the zod schema, so bad values fail schema validation. */
export function checkDifficulty(slug: string, parsed: ParsedLesson): Issue[] {
  if (parsed.version !== 1) return [];
  const issues: Issue[] = [];
  const { difficulty, examples, practice } = parsed.data;
  if (!difficulty || !TOPIC_DIFFICULTIES.includes(difficulty)) {
    issues.push({
      slug,
      path: 'difficulty',
      rule: 'difficulty-topic',
      message: `Topic difficulty ${JSON.stringify(difficulty ?? null)} must be one of ${TOPIC_DIFFICULTIES.join(' | ')}.`,
    });
  }
  const problem = (value: string | null | undefined, path: string): void => {
    if (!value || !PROBLEM_DIFFICULTIES.includes(value)) {
      issues.push({
        slug,
        path,
        rule: 'difficulty-problem',
        message: `Problem difficulty ${JSON.stringify(value ?? null)} must be one of ${PROBLEM_DIFFICULTIES.join(' | ')}.`,
      });
    }
  };
  examples?.forEach((ex, i) => problem(ex.difficulty, `examples[${i}].difficulty`));
  practice?.forEach((p, i) => problem(p.difficulty, `practice[${i}].difficulty`));
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 8 — problem URLs
// ---------------------------------------------------------------------------

const LEETCODE_URL_RE = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/;
const GFG_URL_RE = /^https:\/\/www\.geeksforgeeks\.org\/\S+$/;

export function isValidProblemUrl(url: string): boolean {
  return LEETCODE_URL_RE.test(url) || GFG_URL_RE.test(url);
}

export function checkUrls(slug: string, parsed: ParsedLesson): Issue[] {
  const urls: Array<{ path: string; url: string | null | undefined }> =
    parsed.version === 1
      ? [
          ...(parsed.data.examples ?? []).map((ex, i) => ({ path: `examples[${i}].leetcodeUrl`, url: ex.leetcodeUrl })),
          ...(parsed.data.practice ?? []).map((p, i) => ({ path: `practice[${i}].url`, url: p.url })),
        ]
      : [
          ...parsed.data.examples.map((ex, i) => ({ path: `examples[${i}].url`, url: ex.url })),
          ...parsed.data.practice.map((p, i) => ({ path: `practice[${i}].url`, url: p.url })),
        ];

  const issues: Issue[] = [];
  for (const { path, url } of urls) {
    if (url === undefined || url === null || url.trim() === '') {
      issues.push({ slug, path, rule: 'url', message: 'URL is empty.' });
    } else if (url.trim() === '#') {
      issues.push({ slug, path, rule: 'url', message: 'URL is a "#" placeholder.' });
    } else if (!isValidProblemUrl(url)) {
      issues.push({
        slug,
        path,
        rule: 'url',
        message: `URL "${url}" must look like https://leetcode.com/problems/<slug>/ (or https://www.geeksforgeeks.org/...).`,
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 9 — placeholder text (any lesson, raw JSON)
// ---------------------------------------------------------------------------

const PLACEHOLDER_RE = /coming soon|\bTODO\b|\blorem\b|omitted for brevity/i;

export function checkPlaceholders(slug: string, lesson: unknown): Issue[] {
  const issues: Issue[] = [];
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      const match = PLACEHOLDER_RE.exec(value);
      if (match) {
        issues.push({ slug, path, rule: 'placeholder', message: `Placeholder text "${match[0]}".` });
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (isRecord(value)) {
      for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key);
    }
  };
  walk(lesson, '');
  if (isRecord(lesson) && lesson.comingSoon === true) {
    issues.push({ slug, path: 'comingSoon', rule: 'placeholder', message: 'Lesson is flagged `comingSoon: true`.' });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Rule 10 — recognition quiz uses curriculum slugs (v2)
// ---------------------------------------------------------------------------

export function checkRecogniseQuiz(slug: string, parsed: ParsedLesson, curriculumSlugs: ReadonlySet<string>): Issue[] {
  if (parsed.version !== 2) return [];
  const issues: Issue[] = [];
  parsed.data.recognise.quiz.forEach((item, i) => {
    const base = `recognise.quiz[${i}]`;
    item.options.forEach((option, j) => {
      if (!curriculumSlugs.has(option)) {
        issues.push({ slug, path: `${base}.options[${j}]`, rule: 'recognise-slug', message: `"${option}" is not a curriculum slug.` });
      }
    });
    if (!curriculumSlugs.has(item.answer)) {
      issues.push({ slug, path: `${base}.answer`, rule: 'recognise-slug', message: `"${item.answer}" is not a curriculum slug.` });
    }
    if (!item.options.includes(item.answer)) {
      issues.push({ slug, path: `${base}.answer`, rule: 'recognise-answer', message: `Answer "${item.answer}" is not among the options.` });
    }
  });
  return issues;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/** Pass as a lesson value when the file exists but is not valid JSON. */
export class JsonParseError {
  constructor(public readonly message: string) {}
}

export interface ValidateInput {
  curriculum: unknown
  /** slug (file name without .json) → parsed JSON. */
  lessons: Record<string, unknown>
  /** Path relative to content/code, forward slashes, e.g. `sliding-window/max-sum-k.py`. */
  codeFiles: Record<string, string>
}

export interface ValidateResult {
  errors: Issue[]
  warnings: Issue[]
}

/** Every rule that applies to one lesson, before severity is applied. */
export function checkLesson(
  meta: Pick<CurriculumLesson, 'slug' | 'status'>,
  lesson: unknown,
  curriculumSlugs: ReadonlySet<string>,
  codeFiles: Record<string, string>,
): Issue[] {
  const { slug } = meta;
  if (lesson instanceof JsonParseError) {
    return [{ slug, path: '', rule: 'json', message: `content/topics/${slug}.json is not valid JSON: ${lesson.message}` }];
  }

  if (meta.status === 'live') {
    const live = checkLiveRequirements(slug, lesson);
    if (live.length > 0) return [...live, ...checkPlaceholders(slug, lesson)];
  }

  const outcome = parseLesson(slug, lesson);
  if (!outcome.ok) return [...outcome.issues, ...checkPlaceholders(slug, lesson)];
  const { parsed } = outcome;

  return [
    ...checkCode(slug, parsed, codeFiles),
    ...checkAnchors(slug, parsed, codeFiles),
    ...checkStepperLines(slug, parsed),
    ...checkQuiz(slug, parsed),
    ...checkDifficulty(slug, parsed),
    ...checkUrls(slug, parsed),
    ...checkPlaceholders(slug, lesson),
    ...checkRecogniseQuiz(slug, parsed, curriculumSlugs),
  ];
}

export function validateAll(input: ValidateInput): ValidateResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  const curriculum = curriculumSchema.safeParse(input.curriculum);
  if (!curriculum.success) {
    errors.push(...zodToIssues(CURRICULUM_SLUG, curriculum.error, 'curriculum-schema'));
    return { errors, warnings };
  }

  errors.push(...checkCurriculum(curriculum.data, Object.keys(input.lessons)));

  const slugs = new Set(curriculum.data.lessons.map((lesson) => lesson.slug));
  const visited = new Set<string>();
  for (const meta of curriculum.data.lessons) {
    if (visited.has(meta.slug)) continue;
    visited.add(meta.slug);
    if (!(meta.slug in input.lessons)) continue; // reported as curriculum-missing-file
    const issues = checkLesson(meta, input.lessons[meta.slug], slugs, input.codeFiles);
    (meta.status === 'live' ? errors : warnings).push(...issues);
  }
  return { errors, warnings };
}
