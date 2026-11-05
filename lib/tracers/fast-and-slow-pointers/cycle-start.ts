/**
 * Fast and slow pointers — where does the loop start? (LeetCode 142, Floyd's algorithm)
 *
 * Phase 1 is the cycle race: slow takes 1 step, fast takes 2, until they meet
 * inside the loop. Phase 2 puts slow back on the head and moves BOTH pointers
 * one step at a time. They meet again exactly on the cycle entry: the distance
 * from the head to the entry equals the distance from the meeting point on to
 * the entry, give or take whole laps of the loop.
 *
 * Input is `values` plus `pos`, the index the tail links back to (-1 = none).
 * The result is the index of the cycle entry, or -1 when the list has no cycle
 * (LeetCode returns null).
 * Code lives in content/code/fast-and-slow-pointers/cycle-start.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { PredictCandidate, Tracer } from '@/lib/engine/types'
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

const ONE_STEP = '1 step'
const TWO_STEPS = '2 steps'

function run({ values, pos }: LoopListInput) {
  const rec = createRecorder<number>()
  const n = values.length
  const put = createRaceEmitter(values, pos, rec)
  const v = (i: number | null): string => nameOf(values, i)

  let slow = 0
  let fast: number | null = 0
  const emit = (at: string, say: string, extras: Parameters<typeof put>[3] = {}): void =>
    put(at, say, { slow, fast }, extras)

  emit('init', `slow and fast both start on the head, ${values[0]}. Phase 1: race until they meet inside the loop.`, {
    annotations: [
      { target: 'ptr:slow', text: '1 step a lap' },
      { target: 'ptr:fast', text: '2 steps a lap' },
    ],
  })

  // ---- Phase 1: the cycle race ------------------------------------------
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

    slow = nextOf(n, pos, slow) as number
    fast = nextOf(n, pos, nextOf(n, pos, f) as number)
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

    if (slow === fast) {
      met = true
      emit('meet', `slow and fast are both on ${v(slow)}: they met inside the loop. Now find where the loop starts.`, {
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

  if (!met || fast === null) {
    emit('done', 'fast fell off the end, so the list has no loop and no entry. Return null.')
    return rec.done(-1)
  }

  // ---- Phase 2: reset slow to the head, walk both one step at a time -----
  const meeting: number = fast
  const walkTotal = pos // slow needs exactly `pos` steps to reach the entry
  const resetPredict = (): PredictCandidate | undefined => {
    if (walkTotal === 1) return whereTheyMeet()
    if (walkTotal >= 2) return speedAfterReset()
    return undefined
  }
  const whereTheyMeet = (): PredictCandidate => ({
    tag: 'where-they-meet',
    kind: 'cell',
    prompt: `slow is on ${v(slow)}, fast is on ${v(fast)}. Both take one more step and land on the same node. Click it.`,
    answer: idOf(pos),
    why: `Both land on ${values[pos]}, the node the tail links back to. That is the entry of the loop.`,
    hint: 'Where does the loop begin: the node the tail points back at?',
  })
  const speedAfterReset = (): PredictCandidate => ({
    tag: 'speed-after-reset',
    kind: 'choice',
    prompt: 'slow is back on the head. From now on, how many steps does fast take each lap?',
    options: [ONE_STEP, TWO_STEPS],
    answer: ONE_STEP,
    why: 'Now both pointers walk at the same speed, so the gap between them never changes until they land together.',
    hint: 'Phase 2 moves both pointers the same way.',
  })

  slow = 0
  emit(
    'reset',
    `Put slow back on the head, ${v(0)}. Head to entry equals meeting point to entry, give or take whole laps, so they meet at the entry.`,
    {
      annotations: [{ target: `node:${idOf(meeting)}`, text: 'first meeting' }],
      ...(resetPredict() ? { predict: resetPredict() } : {}),
    },
  )

  let walked = 0
  while (slow !== fast && !rec.capped) {
    const f = fast as number
    slow = nextOf(n, pos, slow) as number
    fast = nextOf(n, pos, f)
    walked++
    const together = slow === fast
    const lastBefore = !together && walked === walkTotal - 1
    emit(
      'walk',
      together
        ? `Both take 1 step onto ${v(slow)}: the same node. That is where the loop begins.`
        : `Both take 1 step: slow to ${v(slow)}, fast to ${v(fast)}. Still different nodes.`,
      {
        annotations: [
          { target: 'ptr:slow', text: 'one step' },
          { target: 'ptr:fast', text: 'one step' },
        ],
        ...(together ? { marks: [{ id: idOf(slow), role: 'found' as const }] } : {}),
        ...(lastBefore ? { predict: whereTheyMeet() } : {}),
      },
    )
  }

  emit('done', `slow and fast stand on the same node, ${v(slow)}. Return it: the loop starts there.`, {
    marks: [{ id: idOf(slow), role: 'found' }],
  })
  return rec.done(slow)
}

/** Independent version: walk with a set of seen nodes; the first node reached twice is the entry. */
function reference({ values, pos }: LoopListInput): number {
  return firstRepeat(values.length, pos)
}

const tracer: Tracer<LoopListInput, number> = {
  id: 'fast-and-slow-pointers/cycle-start',
  title: 'Find the cycle start',
  anchors: {
    init: 'Start slow and fast on the head',
    check: 'Phase 1: keep going while fast and fast.next exist',
    move: 'slow takes 1 step, fast takes 2',
    meet: 'If slow and fast are the same node, they met',
    reset: 'Phase 2: put slow back on the head',
    walk: 'Move both 1 step until they are the same node',
    done: 'Return that node (the cycle start), or null',
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
      { label: 'Loop starts at 15 (index 2)', value: { values: [4, 8, 15, 16, 23, 42], pos: 2 } },
      { label: 'The loop starts at the head', value: { values: [5, 9, 12], pos: 0 } },
      { label: 'No cycle', value: { values: [1, 2, 3, 4], pos: -1 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, 8)
      const values = distinctValues(rand, len)
      const pos = rand() < 0.25 ? -1 : randInt(rand, 0, len - 1)
      return { values, pos }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
