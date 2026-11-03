import { describe, expect, it } from 'vitest';
import {
  JsonParseError,
  checkAnchors,
  checkCode,
  checkCurriculum,
  checkDifficulty,
  checkLiveRequirements,
  checkPlaceholders,
  checkQuiz,
  checkRecogniseQuiz,
  checkStepperLines,
  checkUrls,
  isValidProblemUrl,
  lessonV2Schema,
  parseAnchors,
  parseLesson,
  validateAll,
} from '@/lib/content-schema';
import type { ParsedLesson } from '@/lib/content-schema';
import type { Curriculum, CurriculumLesson, LessonV2 } from '@/types/learning';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function meta(slug: string, patch: Partial<CurriculumLesson> = {}): CurriculumLesson {
  return {
    slug,
    title: slug,
    group: 'algorithms',
    glyph: 'arrays',
    difficulty: 'beginner',
    status: 'draft',
    minutes: 10,
    oneLiner: 'One liner.',
    trigger: 'A trigger.',
    prereqs: [],
    related: [],
    ...patch,
  };
}

function curriculum(...lessons: CurriculumLesson[]): Curriculum {
  return {
    groups: [
      { id: 'data-structures', title: 'Data Structures', blurb: 'Layouts.' },
      { id: 'algorithms', title: 'Algorithms', blurb: 'Moves.' },
    ],
    lessons,
  };
}

const PY = ['def f(xs):', '    total = 0  # @init', '    return total  # @done'].join('\n');
const JAVA = ['int f(int[] xs) {', '  int total = 0; // @init', '  return total; // @done', '}'].join('\n');
const CPP = ['int f(std::vector<int>& xs) {', '  int total = 0; // @init', '  return total; // @done', '}'].join('\n');

function codeFor(ref: string, overrides: Partial<Record<'py' | 'java' | 'cpp', string>> = {}): Record<string, string> {
  return {
    [`${ref}.py`]: overrides.py ?? PY,
    [`${ref}.java`]: overrides.java ?? JAVA,
    [`${ref}.cpp`]: overrides.cpp ?? CPP,
  };
}

function v2(slug = 'two-pointers', patch: Record<string, unknown> = {}): LessonV2 {
  const lesson: LessonV2 = {
    schemaVersion: 2,
    slug,
    hook: { question: 'How?', paragraphs: ['Think.'], aha: 'Like this.' },
    shape: {
      scene: { kind: 'array', cells: [1, 2, 3] },
      callouts: [{ target: 'cell:0', text: 'start here' }],
    },
    mentalModel: { metaphor: ['Two fingers.'], click: 'Move one.', glossary: [{ term: 'pointer', definition: 'An index.' }] },
    stage: { tracks: [{ id: 'main', label: 'Main', tracer: `${slug}/main` }], playground: true },
    recognise: {
      useWhen: ['Sorted input'],
      notWhen: [],
      quiz: [{ problem: 'Pair sum in sorted array', answer: 'two-pointers', options: ['two-pointers', 'arrays'], explanation: 'Because.' }],
    },
    template: {
      pseudocode: [{ text: 'start', anchor: 'init' }, { text: 'finish', anchor: 'done' }],
      tracer: `${slug}/main`,
      time: 'O(n)',
      space: 'O(1)',
    },
    examples: [{
      title: 'Two Sum II',
      difficulty: 'medium',
      url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
      problem: 'Find a pair.',
      input: '[1,2]',
      output: '[0,1]',
      approach: ['Move pointers.'],
      code: `${slug}/main`,
      time: 'O(n)',
      space: 'O(1)',
    }],
    conceptQuiz: [
      { question: 'q1', options: ['a', 'b', 'c'], answer: 0, explanation: 'e' },
      { question: 'q2', options: ['a', 'b', 'c'], answer: 1, explanation: 'e' },
      { question: 'q3', options: ['a', 'b', 'c'], answer: 2, explanation: 'e' },
    ],
    practice: [{ title: 'Valid Palindrome', url: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'easy', insight: 'Compare ends.' }],
  };
  return { ...lesson, ...patch } as LessonV2;
}

function parsedV2(patch: Record<string, unknown> = {}, slug = 'two-pointers'): ParsedLesson {
  return { version: 2, data: v2(slug, patch) };
}

interface V1Parts {
  difficulty?: string
  stepper?: unknown
  operations?: unknown
  examples?: unknown
  conceptQuiz?: unknown
  practice?: unknown
  comingSoon?: boolean
}

function v1Raw(parts: V1Parts = {}): Record<string, unknown> {
  return { slug: 'arrays', title: 'Arrays', difficulty: 'beginner', ...parts };
}

function parsedV1(parts: V1Parts = {}): ParsedLesson {
  const outcome = parseLesson('arrays', v1Raw(parts));
  if (!outcome.ok) throw new Error(JSON.stringify(outcome.issues));
  return outcome.parsed;
}

const fullCode = { python: 'x = 1', java: 'int x = 1;', cpp: 'int x = 1;' };
const rules = (issues: Array<{ rule: string }>): string[] => issues.map((issue) => issue.rule);

// ---------------------------------------------------------------------------
// Rule 1 — curriculum
// ---------------------------------------------------------------------------

describe('rule 1: curriculum', () => {
  it('passes a consistent curriculum', () => {
    const c = curriculum(meta('a', { related: ['b'] }), meta('b', { prereqs: ['a'] }));
    expect(checkCurriculum(c, ['a', 'b'])).toEqual([]);
  });

  it('flags duplicate slugs', () => {
    const issues = checkCurriculum(curriculum(meta('a'), meta('a')), ['a']);
    expect(rules(issues)).toContain('curriculum-unique-slug');
  });

  it('flags unknown prereqs and related slugs', () => {
    const issues = checkCurriculum(curriculum(meta('a', { prereqs: ['nope'], related: ['ghost'] })), ['a']);
    expect(issues.filter((i) => i.rule === 'curriculum-ref')).toHaveLength(2);
  });

  it('flags a curriculum entry with no topic file', () => {
    const issues = checkCurriculum(curriculum(meta('a'), meta('b')), ['a']);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'curriculum-missing-file' });
  });

  it('flags an orphan topic file', () => {
    const issues = checkCurriculum(curriculum(meta('a')), ['a', 'stray']);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'orphan-file', slug: 'stray' });
  });

  it('reports schema problems as errors and stops', () => {
    const bad = { groups: [], lessons: [{ slug: 'a' }] };
    const { errors, warnings } = validateAll({ curriculum: bad, lessons: {}, codeFiles: {} });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((e) => e.rule === 'curriculum-schema')).toBe(true);
    expect(warnings).toEqual([]);
  });

  it('flags an unknown glyph in the schema', () => {
    const c = curriculum(meta('a', { glyph: 'nonsense' as never }));
    const { errors } = validateAll({ curriculum: c, lessons: { a: v1Raw() }, codeFiles: {} });
    expect(rules(errors)).toContain('curriculum-schema');
  });
});

// ---------------------------------------------------------------------------
// Rule 2 — live lessons
// ---------------------------------------------------------------------------

describe('rule 2: live lessons must be valid v2', () => {
  it('accepts a valid v2 lesson', () => {
    expect(checkLiveRequirements('two-pointers', v2())).toEqual([]);
    expect(lessonV2Schema.safeParse(v2()).success).toBe(true);
  });

  it('rejects a v1 lesson', () => {
    expect(rules(checkLiveRequirements('arrays', v1Raw()))).toEqual(['live-schema-version']);
  });

  it('rejects a v2 lesson that fails the schema', () => {
    const broken = { ...v2(), hook: { question: '', paragraphs: [], aha: 'x' } };
    const issues = checkLiveRequirements('two-pointers', broken);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.rule === 'schema')).toBe(true);
  });

  it('rejects unknown keys (typo protection) and bad scene kinds', () => {
    expect(checkLiveRequirements('two-pointers', { ...v2(), extra: true }).length).toBeGreaterThan(0);
    const badScene = v2('two-pointers', { shape: { scene: { kind: 'tree' }, callouts: [{ target: 'x', text: 'y' }] } });
    expect(checkLiveRequirements('two-pointers', badScene).length).toBeGreaterThan(0);
  });

  it('rejects a slug that does not match', () => {
    expect(rules(checkLiveRequirements('other', v2()))).toEqual(['slug-mismatch']);
  });

  it('rejects malformed code refs', () => {
    const bad = v2('two-pointers', { template: { ...v2().template, tracer: 'no-slash' } });
    expect(checkLiveRequirements('two-pointers', bad).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

describe('live vs draft severity', () => {
  const lessons = (status: 'live' | 'draft') => ({
    curriculum: curriculum(meta('arrays', { status })),
    lessons: { arrays: v1Raw() },
    codeFiles: {},
  });

  it('turns lesson issues into errors for live lessons', () => {
    const { errors, warnings } = validateAll(lessons('live'));
    expect(rules(errors)).toContain('live-schema-version');
    expect(warnings).toEqual([]);
  });

  it('turns lesson issues into warnings for draft lessons', () => {
    const input = lessons('draft');
    input.lessons = { arrays: v1Raw({ difficulty: 'medium' }) };
    const { errors, warnings } = validateAll(input);
    expect(errors).toEqual([]);
    expect(rules(warnings)).toContain('difficulty-topic');
  });

  it('keeps curriculum-level problems as errors even when lessons are drafts', () => {
    const { errors } = validateAll({
      curriculum: curriculum(meta('arrays', { prereqs: ['ghost'] })),
      lessons: { arrays: v1Raw() },
      codeFiles: {},
    });
    expect(rules(errors)).toEqual(['curriculum-ref']);
  });

  it('reports a missing topic file and an orphan file as errors', () => {
    const { errors } = validateAll({
      curriculum: curriculum(meta('arrays'), meta('vectors')),
      lessons: { arrays: v1Raw(), stray: v1Raw() },
      codeFiles: {},
    });
    expect(rules(errors).sort()).toEqual(['curriculum-missing-file', 'orphan-file']);
  });

  it('accepts a fully valid live v2 lesson with code', () => {
    const slug = 'two-pointers';
    const result = validateAll({
      curriculum: curriculum(meta(slug, { status: 'live', related: [], prereqs: [] }), meta('arrays')),
      lessons: { [slug]: v2(slug), arrays: v1Raw() },
      codeFiles: codeFor(`${slug}/main`),
    });
    expect(result.errors).toEqual([]);
  });

  it('reports unparseable JSON, by severity', () => {
    const draft = validateAll({ curriculum: curriculum(meta('arrays')), lessons: { arrays: new JsonParseError('boom') }, codeFiles: {} });
    expect(rules(draft.warnings)).toEqual(['json']);
    const live = validateAll({ curriculum: curriculum(meta('arrays', { status: 'live' })), lessons: { arrays: new JsonParseError('boom') }, codeFiles: {} });
    expect(rules(live.errors)).toEqual(['json']);
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — code
// ---------------------------------------------------------------------------

describe('rule 3: code in all languages', () => {
  it('v1 passes with python/java/cpp present (javascript ignored)', () => {
    const parsed = parsedV1({
      operations: [{ code: fullCode }],
      examples: [{ code: fullCode, difficulty: 'easy', leetcodeUrl: 'https://leetcode.com/problems/x/' }],
    });
    expect(checkCode('arrays', parsed, {})).toEqual([]);
  });

  it('v1 flags missing or blank languages in operations and examples', () => {
    const parsed = parsedV1({
      operations: [{ code: { python: 'x', java: '   ' } }],
      examples: [{ code: { ...fullCode, cpp: '' } }],
    });
    const paths = checkCode('arrays', parsed, {}).map((i) => i.path);
    expect(paths).toEqual(['operations[0].code.java', 'operations[0].code.cpp', 'examples[0].code.cpp']);
  });

  it('v2 passes when every referenced file exists and is non-empty', () => {
    expect(checkCode('two-pointers', parsedV2(), codeFor('two-pointers/main'))).toEqual([]);
  });

  it('v2 flags missing and empty files', () => {
    const files = codeFor('two-pointers/main', { java: '  \n' });
    delete files['two-pointers/main.cpp'];
    const messages = checkCode('two-pointers', parsedV2(), files).map((i) => i.message);
    expect(messages.some((m) => m.includes('main.cpp does not exist'))).toBe(true);
    expect(messages.some((m) => m.includes('main.java is empty'))).toBe(true);
  });

  it('v2 checks every kind of CodeRef', () => {
    const lesson = parsedV2({
      stage: { tracks: [{ id: 't', label: 'T', tracer: 'two-pointers/track' }], playground: true },
      examples: [{ ...v2().examples[0], code: 'two-pointers/example' }],
    });
    const files = codeFor('two-pointers/main');
    const paths = checkCode('two-pointers', lesson, files).map((i) => i.path);
    expect(paths).toContain('examples[0].code');
    expect(paths).toContain('stage.tracks[0].tracer');
  });
});

// ---------------------------------------------------------------------------
// Rule 4 — anchors
// ---------------------------------------------------------------------------

describe('anchor parsing', () => {
  it('reads python and // markers and strips them', () => {
    const parsed = parseAnchors('a = 1  # @init\nb = 2\nc = 3  # @init\nreturn  # @done');
    expect(parsed.anchors).toEqual({ init: [1, 3], done: [4] });
    expect(parsed.source).toBe('a = 1\nb = 2\nc = 3\nreturn');
    expect(parseAnchors('int a;   // @expand-step').anchors).toEqual({ 'expand-step': [1] });
  });

  it('ignores markers that are not trailing or not lower-case ids', () => {
    expect(parseAnchors('# @init at start\nx = 1  # @Init\nx = "a // @b" + y').anchors).toEqual({});
  });
});

describe('rule 4: anchors consistent across languages and pseudocode', () => {
  it('passes when anchors match everywhere', () => {
    expect(checkAnchors('two-pointers', parsedV2(), codeFor('two-pointers/main'))).toEqual([]);
  });

  it('flags an anchor missing in one language', () => {
    const files = codeFor('two-pointers/main', { cpp: CPP.replace(' // @done', '') });
    const issues = checkAnchors('two-pointers', parsedV2(), files);
    expect(rules(issues)).toContain('anchor-mismatch');
    expect(issues[0].message).toContain('@done');
    expect(issues[0].message).toContain('cpp');
  });

  it('flags a pseudocode anchor absent from the code', () => {
    const lesson = parsedV2({ template: { ...v2().template, pseudocode: [{ text: 'x', anchor: 'ghost' }] } });
    const issues = checkAnchors('two-pointers', lesson, codeFor('two-pointers/main'));
    expect(rules(issues)).toEqual(['pseudocode-anchor']);
    expect(issues[0].path).toBe('template.pseudocode[0].anchor');
  });

  it('does not apply to v1 lessons', () => {
    expect(checkAnchors('arrays', parsedV1(), {})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rule 5 — stepper lines
// ---------------------------------------------------------------------------

describe('rule 5: stepper active lines (v1)', () => {
  const examples = [{ code: { python: 'a\nb\nc\n', java: 'x', cpp: 'x' } }];
  const steps = (...lines: number[]) => ({ steps: lines.map((activeLine) => ({ activeLine })) });

  it('passes when lines are within the python example', () => {
    expect(checkStepperLines('arrays', parsedV1({ stepper: steps(1, 2, 3), examples }))).toEqual([]);
  });

  it('flags lines outside 1..N (trailing newline is not a line)', () => {
    const issues = checkStepperLines('arrays', parsedV1({ stepper: steps(0, 3, 4), examples }));
    expect(issues.map((i) => i.path)).toEqual(['stepper.steps[0].activeLine', 'stepper.steps[2].activeLine']);
  });

  it('flags a stepper with no python example to check against', () => {
    expect(rules(checkStepperLines('arrays', parsedV1({ stepper: steps(1) })))).toEqual(['stepper-lines']);
  });
});

// ---------------------------------------------------------------------------
// Rule 6 — quiz skew
// ---------------------------------------------------------------------------

describe('rule 6: quiz skew and range', () => {
  const q = (correctIndex: number) => ({ question: 'q', options: ['a', 'b', 'c', 'd'], correctIndex, explanation: 'e' });

  it('v1 passes a varied quiz', () => {
    expect(checkQuiz('arrays', parsedV1({ conceptQuiz: [q(0), q(1), q(2), q(3), q(1)] }))).toEqual([]);
  });

  it('v1 flags an index over 60%', () => {
    const issues = checkQuiz('arrays', parsedV1({ conceptQuiz: [q(1), q(1), q(1), q(1), q(0)] }));
    expect(rules(issues)).toEqual(['quiz-skew']);
  });

  it('allows exactly 60% (3 of 5)', () => {
    expect(checkQuiz('arrays', parsedV1({ conceptQuiz: [q(1), q(1), q(1), q(0), q(2)] }))).toEqual([]);
  });

  it('does not check skew below 3 questions', () => {
    expect(checkQuiz('arrays', parsedV1({ conceptQuiz: [q(1), q(1)] }))).toEqual([]);
  });

  it('flags an out-of-range answer in v1 and v2', () => {
    expect(rules(checkQuiz('arrays', parsedV1({ conceptQuiz: [q(9)] })))).toEqual(['quiz-range']);
    const bad = parsedV2({ conceptQuiz: [{ question: 'q', options: ['a', 'b'], answer: 2, explanation: 'e' }] });
    expect(rules(checkQuiz('two-pointers', bad))).toEqual(['quiz-range']);
  });

  it('v2 flags skew and passes variety', () => {
    const item = (answer: number) => ({ question: 'q', options: ['a', 'b', 'c'], answer, explanation: 'e' });
    expect(rules(checkQuiz('two-pointers', parsedV2({ conceptQuiz: [item(2), item(2), item(2), item(0)] })))).toEqual(['quiz-skew']);
    expect(checkQuiz('two-pointers', parsedV2())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rule 7 — difficulty
// ---------------------------------------------------------------------------

describe('rule 7: difficulty vocabulary', () => {
  it('passes valid v1 values', () => {
    const parsed = parsedV1({
      difficulty: 'advanced',
      examples: [{ difficulty: 'hard' }],
      practice: [{ difficulty: 'easy', url: 'x' }, { difficulty: 'medium', url: 'x' }],
    });
    expect(checkDifficulty('arrays', parsed)).toEqual([]);
  });

  it('flags a bad topic difficulty and bad problem difficulties', () => {
    const parsed = parsedV1({
      difficulty: 'medium',
      examples: [{ difficulty: 'beginner' }],
      practice: [{ difficulty: 'Easy', url: 'x' }],
    });
    expect(checkDifficulty('arrays', parsed).map((i) => i.path)).toEqual([
      'difficulty',
      'examples[0].difficulty',
      'practice[0].difficulty',
    ]);
  });

  it('v2 enums are enforced by the schema', () => {
    const bad = { ...v2(), practice: [{ ...v2().practice[0], difficulty: 'hardish' }] };
    expect(checkLiveRequirements('two-pointers', bad).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Rule 8 — URLs
// ---------------------------------------------------------------------------

describe('rule 8: problem URLs', () => {
  it('recognises valid URLs', () => {
    expect(isValidProblemUrl('https://leetcode.com/problems/two-sum/')).toBe(true);
    expect(isValidProblemUrl('https://www.geeksforgeeks.org/binary-search/')).toBe(true);
    expect(isValidProblemUrl('http://leetcode.com/problems/two-sum/')).toBe(false);
    expect(isValidProblemUrl('https://leetcode.com/problems/two-sum')).toBe(false);
    expect(isValidProblemUrl('https://leetcode.com/problems/Two_Sum/')).toBe(false);
  });

  it('passes v1 and v2 lessons with good URLs', () => {
    const v1 = parsedV1({
      examples: [{ leetcodeUrl: 'https://leetcode.com/problems/two-sum/' }],
      practice: [{ url: 'https://leetcode.com/problems/valid-anagram/' }],
    });
    expect(checkUrls('arrays', v1)).toEqual([]);
    expect(checkUrls('two-pointers', parsedV2())).toEqual([]);
  });

  it('flags empty, "#" and malformed URLs', () => {
    const v1 = parsedV1({
      examples: [{ leetcodeUrl: '' }],
      practice: [{ url: '#' }, { url: 'https://example.com/x' }, {}],
    });
    expect(checkUrls('arrays', v1).map((i) => i.path)).toEqual([
      'examples[0].leetcodeUrl',
      'practice[0].url',
      'practice[1].url',
      'practice[2].url',
    ]);
    const bad = parsedV2({ practice: [{ ...v2().practice[0], url: '#' }] });
    expect(checkUrls('two-pointers', bad).map((i) => i.path)).toEqual(['practice[0].url']);
  });
});

// ---------------------------------------------------------------------------
// Rule 9 — placeholders
// ---------------------------------------------------------------------------

describe('rule 9: placeholder text', () => {
  it('passes clean content', () => {
    expect(checkPlaceholders('arrays', { a: ['Fine text', { b: 'A mastodon walks in' }] })).toEqual([]);
  });

  it.each(['Coming Soon', 'TODO: fix', 'todo', 'Lorem ipsum', 'code omitted for brevity'])('flags "%s"', (text) => {
    const issues = checkPlaceholders('arrays', { stepper: { steps: [{ explanation: `x ${text} y` }] } });
    expect(issues).toHaveLength(1);
    expect(issues[0].path).toBe('stepper.steps[0].explanation');
  });

  it('flags comingSoon: true', () => {
    expect(checkPlaceholders('arrays', { comingSoon: true }).map((i) => i.path)).toEqual(['comingSoon']);
  });
});

// ---------------------------------------------------------------------------
// Rule 10 — recognise quiz
// ---------------------------------------------------------------------------

describe('rule 10: recognise quiz slugs', () => {
  const slugs = new Set(['two-pointers', 'arrays', 'sorting']);
  const quiz = (answer: string, options: string[]) =>
    parsedV2({ recognise: { useWhen: ['x'], notWhen: [], quiz: [{ problem: 'p', answer, options, explanation: 'e' }] } });

  it('passes when answer and options are curriculum slugs and answer is an option', () => {
    expect(checkRecogniseQuiz('two-pointers', quiz('arrays', ['arrays', 'sorting']), slugs)).toEqual([]);
  });

  it('flags non-curriculum options and answers', () => {
    const issues = checkRecogniseQuiz('two-pointers', quiz('ghost', ['ghost', 'sorting', 'phantom']), slugs);
    expect(issues.filter((i) => i.rule === 'recognise-slug').map((i) => i.path)).toEqual([
      'recognise.quiz[0].options[0]',
      'recognise.quiz[0].options[2]',
      'recognise.quiz[0].answer',
    ]);
  });

  it('flags an answer that is not among the options', () => {
    expect(rules(checkRecogniseQuiz('two-pointers', quiz('arrays', ['sorting', 'two-pointers']), slugs))).toEqual(['recognise-answer']);
  });

  it('does not apply to v1', () => {
    expect(checkRecogniseQuiz('arrays', parsedV1(), slugs)).toEqual([]);
  });
});
