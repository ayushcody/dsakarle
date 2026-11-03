/**
 * Fast and slow pointers — does this list loop? (LeetCode 141)
 *
 * slow takes 1 step per lap, fast takes 2. If the list loops, fast comes up
 * behind slow and lands on it; if the list ends, fast runs off the end first.
 * Each lap is three frames: check (can fast take two steps?), move (both
 * pointers step), meet (are they on the same node?).
 *
 * Input is `values` plus `pos`, the index the tail links back to (-1 = none).
 * Node ids are `n0..nk`; a cycle is one extra link from the tail back to `pos`.
 * Code lives in content/code/fast-and-slow-pointers/cycle.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { Tracer } from '@/lib/engine/types'
import {
  LIMITS,
  POS_FIELD,
  VALUES_FIELD,
  canRace,
  createRaceEmitter,
  distinctValues,
  firstRepeat,
  idOf,
  meetOrNullPredict,
  nameOf,
  nextOf,
  parseLoopList,
  whereFastLandsPredict,
} from './shared'
import type { LoopListInput } from './shared'

function run({ values, pos }: LoopListInput) {
  const rec = createRecorder<boolean>()
  const n = values.length
  const put = createRaceEmitter(values, pos, rec)
  const v = (i: number | null): string => nameOf(values, i)

  let slow = 0
  let fast: number | null = 0
  let steps = 0
  const gauge = () => ({ value: steps, max: n, label: 'Steps slow has taken' })
  const emit = (at: string, say: string, extras: Parameters<typeof put>[3] = {}): void =>
    put(at, say, { slow, fast }, { gauge: gauge(), ...extras })

  emit('init', `slow and fast both start on the head, ${values[0]}. Each lap slow takes 1 step and fast takes 2.`, {
    annotations: [
      { target: 'ptr:slow', text: '1 step a lap' },
      { target: 'ptr:fast', text: '2 steps a lap' },
    ],
  })

  let met = false
  while (!rec.capped) {
    const f: number | null = fast
    const racing = canRace(n, pos, f)
    emit(
      'check',
      racing
        ? `fast is on ${v(f)} and has a node after it, so fast can take two steps. Start a lap.`
        : f === null
          ? 'fast is null: it ran off the end of the list, so the loop stops.'
          : `fast is on ${v(f)}, the last node. It has no next, so the loop stops.`,
      racing && f !== null ? { predict: whereFastLandsPredict(values, pos, slow, f) } : {},
    )
    if (!racing || f === null) break

    // move: slow = slow.next; fast = fast.next.next
    slow = nextOf(n, pos, slow) as number
    fast = nextOf(n, pos, nextOf(n, pos, f) as number)
    steps++
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
      },
    )

    // meet: if slow == fast
    if (slow === fast) {
      met = true
      emit('meet', `slow and fast are both on ${v(slow)}: fast has caught up with slow.`, {
        marks: [{ id: idOf(slow), role: 'found' }],
      })
      break
    }
    emit(
      'meet',
      v(slow) === v(fast)
        ? `slow and fast both hold ${v(slow)} but sit on different nodes, so they have not met.`
        : `slow is on ${v(slow)} and fast is on ${v(fast)}: different nodes, so they have not met.`,
      { predict: meetOrNullPredict(values, pos, slow, fast) },
    )
  }

  if (met) {
    emit('done', 'A fast runner only catches a slow one on a loop. Return true: the list has a cycle.', {
      marks: [{ id: idOf(slow), role: 'found' }],
    })
  } else {
    emit('done', 'fast fell off the end, so the list is a straight line. Return false: no cycle.')
  }
  return rec.done(met)
}

/** Independent version: remember every node seen; seeing one twice means a loop. */
function reference({ values, pos }: LoopListInput): boolean {
  return firstRepeat(values.length, pos) !== -1
}

const tracer: Tracer<LoopListInput, boolean> = {
  id: 'fast-and-slow-pointers/cycle',
  title: 'Detect a cycle',
  anchors: {
    init: 'Start slow and fast on the head',
    check: 'Keep going while fast and fast.next exist',
    move: 'slow takes 1 step, fast takes 2',
    meet: 'If slow and fast are the same node, they met',
    done: 'Return true if they met, false if fast ran out',
  },
  vars: [
    { name: 'slow', label: 'slow value', role: 'ptrA' },
    { name: 'fast', label: 'fast value', role: 'ptrB' },
  ],
  input: {
    fields: [VALUES_FIELD, POS_FIELD],
    parse: parseLoopList,
    format: ({ values, pos }) => ({ values: values.join(', '), pos: String(pos) }),
    presets: [
      { label: 'Classic: 3, 2, 0, -4 loops back to 2', value: { values: [3, 2, 0, -4], pos: 1 } },
      { label: 'No cycle: a straight list of five', value: { values: [1, 2, 3, 4, 5], pos: -1 } },
      { label: 'Two nodes looping to the head', value: { values: [1, 2], pos: 0 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, 8)
      const values = distinctValues(rand, len)
      const pos = rand() < 0.35 ? -1 : randInt(rand, 0, len - 1)
      return { values, pos }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
