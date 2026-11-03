/**
 * Fast and slow pointers — the middle of a list in one pass (LeetCode 876).
 *
 * slow takes 1 step per lap, fast takes 2. When fast runs out of list, slow
 * has covered half the distance. For an even number of nodes there are two
 * middles, and this loop returns the SECOND one (LeetCode 876's convention).
 * The result is the INDEX of that node (0 = head).
 *
 * Each lap is two frames: check (can fast take two steps?) and move.
 * Code lives in content/code/fast-and-slow-pointers/middle.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { Tracer } from '@/lib/engine/types'
import {
  LIMITS,
  VALUES_FIELD,
  canRace,
  createRaceEmitter,
  distinctValues,
  idOf,
  nameOf,
  nextOf,
  parsePlainList,
} from './shared'
import type { PlainListInput } from './shared'

const YES = 'Yes, another lap'
const NO = 'No, stop'

function run({ values }: PlainListInput) {
  const rec = createRecorder<number>()
  const n = values.length
  const put = createRaceEmitter(values, -1, rec)
  const v = (i: number | null): string => nameOf(values, i)

  let slow = 0
  let fast: number | null = 0
  const emit = (at: string, say: string, extras: Parameters<typeof put>[3] = {}): void =>
    put(at, say, { slow, fast }, {
      gauge: { value: fast === null ? n : fast, max: n, label: 'Nodes fast has passed' },
      ...extras,
    })

  emit('init', `slow and fast both start on the head, ${values[0]}. fast will take two steps for each step slow takes.`, {
    annotations: [
      { target: 'ptr:slow', text: '1 step a lap' },
      { target: 'ptr:fast', text: '2 steps a lap' },
    ],
  })

  while (!rec.capped) {
    const f: number | null = fast
    const racing = canRace(n, -1, f)
    emit(
      'check',
      racing
        ? `fast is on ${v(f)} and has a node after it, so fast can take two steps. Start a lap.`
        : f === null
          ? 'fast is null: it ran off the end, so the loop stops.'
          : `fast is on ${v(f)}, the last node. It has no next, so the loop stops.`,
      racing
        ? {
            predict: {
              tag: 'where-slow-ends',
              kind: 'cell',
              prompt: `slow is on ${values[slow]} and fast is on ${v(f)}. Both take their steps. Click the node slow ends this lap on.`,
              answer: idOf(slow + 1),
              why: `slow takes exactly one step, from ${values[slow]} to ${values[slow + 1]}, however far fast goes.`,
              hint: 'slow moves one node per lap.',
            },
          }
        : {},
    )
    if (!racing || f === null) break

    // move: slow = slow.next; fast = fast.next.next
    slow = nextOf(n, -1, slow) as number
    fast = nextOf(n, -1, nextOf(n, -1, f) as number)
    const again = canRace(n, -1, fast)
    emit(
      'move',
      fast === null
        ? `slow takes 1 step to ${v(slow)}. fast takes 2 steps and runs off the end, onto null.`
        : `slow takes 1 step to ${v(slow)}. fast takes 2 steps to ${v(fast)}.`,
      {
        annotations: [
          { target: 'ptr:slow', text: 'one step' },
          { target: 'ptr:fast', text: 'two steps' },
        ],
        predict: {
          tag: 'keep-going',
          kind: 'choice',
          prompt: `fast is on ${v(fast)}. Can fast take two more steps, so the loop runs another lap?`,
          options: [YES, NO],
          answer: again ? YES : NO,
          why: again
            ? `fast is on a real node with a node after it, so there is room for another lap.`
            : fast === null
              ? 'fast is null, off the end of the list. The loop is over.'
              : `fast is on the last node, ${v(fast)}, with nothing after it. The loop is over.`,
          hint: 'The loop runs while fast and fast.next both exist.',
        },
      },
    )
  }

  const even = n % 2 === 0
  emit(
    'done',
    even
      ? `fast ran off the end of an even list, so slow is on the second middle node, ${v(slow)}. Return it.`
      : `fast stopped on the last node, so slow is on the exact middle, ${v(slow)}. Return it.`,
    { marks: [{ id: idOf(slow), role: 'found' }] },
  )
  return rec.done(slow)
}

/** Independent version: the middle of n nodes (second middle when n is even) is index n // 2. */
function reference({ values }: PlainListInput): number {
  return Math.floor(values.length / 2)
}

const tracer: Tracer<PlainListInput, number> = {
  id: 'fast-and-slow-pointers/middle',
  title: 'Find the middle',
  anchors: {
    init: 'Start slow and fast on the head',
    check: 'Keep going while fast and fast.next exist',
    move: 'slow takes 1 step, fast takes 2',
    done: 'Return slow: the middle (the second one if two)',
  },
  vars: [
    { name: 'slow', label: 'slow value', role: 'ptrA' },
    { name: 'fast', label: 'fast value', role: 'ptrB' },
  ],
  input: {
    fields: [VALUES_FIELD],
    parse: parsePlainList,
    format: ({ values }) => ({ values: values.join(', ') }),
    presets: [
      { label: 'Odd length: 1 to 5', value: { values: [1, 2, 3, 4, 5] } },
      { label: 'Even length: 1 to 6 (two middles)', value: { values: [1, 2, 3, 4, 5, 6] } },
      { label: 'A list of one', value: { values: [7] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, 8)
      return { values: distinctValues(rand, len) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
