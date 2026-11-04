/**
 * Dynamic programming — coin change (LeetCode 322), minimum over choices.
 *
 * dp[a] is the fewest coins that make amount a. For every coin that fits,
 * dp[a - coin] + 1 is a candidate; dp[a] keeps the smallest. Amounts nobody
 * has reached yet hold "infinity". In the code, infinity is `amount + 1`: more
 * coins than the amount itself is impossible, so it can never win a minimum.
 * The table is a one-row grid so each coin's dependency arrow can be drawn.
 *
 * Coins are sorted ascending (parse does it, run() does it again defensively)
 * so the loop can `break` at the first coin that is too big.
 *
 * Code lives in content/code/dynamic-programming/coin-change.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  GridScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CoinChangeInput {
  /** 1..4 distinct coin values, each 1..10, ascending. */
  coins: number[]
  /** Target amount, 0..15. */
  amount: number
}

export const MAX_COINS = 4
export const MAX_AMOUNT = 15
const LIMITS: InputLimits = { maxN: MAX_COINS, min: 1, max: 10 }
const INTEGER = /^[+-]?\d+$/
const INF = '∞'

function parseInput(raw: Record<string, string>): ParseResult<CoinChangeInput> {
  const coinsText = (raw.coins ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = coinsText.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) return { ok: false, field: 'coins', error: 'Type at least one coin value, like 1, 3, 4.' }
  if (tokens.length > MAX_COINS) return { ok: false, field: 'coins', error: `Use at most ${MAX_COINS} coin values.` }
  const coins: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) return { ok: false, field: 'coins', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field: 'coins', error: `Keep every coin between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    if (coins.includes(value)) return { ok: false, field: 'coins', error: `Each coin value can appear once. ${value} is listed twice.` }
    coins.push(value)
  }
  coins.sort((a, b) => a - b)

  const amountText = (raw.amount ?? '').replace(/[−–]/g, '-').trim()
  if (amountText === '') return { ok: false, field: 'amount', error: 'Type the amount to make, like 6.' }
  if (!INTEGER.test(amountText)) return { ok: false, field: 'amount', error: `The amount must be a whole number, not "${amountText}".` }
  const amount = Number(amountText)
  if (amount < 0) return { ok: false, field: 'amount', error: 'The amount can\'t be negative.' }
  if (amount > MAX_AMOUNT) return { ok: false, field: 'amount', error: `Use an amount of at most ${MAX_AMOUNT} so the table stays readable.` }
  return { ok: true, value: { coins, amount } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** Asked before an amount's first candidate: which coin gives the fewest coins? */
function bestCoinPredict(a: number, coins: number[], dp: number[], infinity: number): PredictCandidate | undefined {
  const fits = coins
    .filter((coin) => coin <= a && dp[a - coin] < infinity)
    .map((coin) => ({ coin, count: dp[a - coin] + 1 }))
  if (fits.length < 2) return undefined
  const best = Math.min(...fits.map((f) => f.count))
  const winners = fits.filter((f) => f.count === best)
  if (winners.length !== 1) return undefined
  const coin = winners[0].coin
  const parts = fits.map((f) => `coin ${f.coin} gives ${f.count}`).join(', ')
  return {
    tag: 'best-coin',
    kind: 'choice',
    prompt: `To make ${a}, which coin as the last one gives the fewest coins in total? Look at dp[${a} − coin] + 1.`,
    options: coins.map((x) => `Coin ${x}`),
    answer: `Coin ${coin}`,
    why: `Compare dp[${a} − coin] + 1 for each coin: ${parts}. Coin ${coin} wins with ${best}.`,
    hint: 'A coin only helps if it fits, and a smaller dp[a − coin] means fewer coins overall.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run(input: CoinChangeInput) {
  const rec = createRecorder<number>()
  const coins = input.coins.slice().sort((x, y) => x - y)
  const amount = input.amount
  const infinity = amount + 1 // "more coins than the amount" = impossible

  const dp: number[] = Array.from({ length: amount + 1 }, () => infinity)
  const show = (v: number): number | string => (v >= infinity ? INF : v)
  const colLabels = dp.map((_, i) => String(i))

  let a: number | null = null
  let coin: number | null = null
  let cand: number | string | null = null
  let best: number | string | null = null
  let solved = 0 // amounts 0..solved-1 are final

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: NonNullable<GridScene['marks']>
      arrows?: GridScene['arrows']
      pointer?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: GridScene = { kind: 'grid', label: 'dp', rows: [dp.map(show)], colLabels }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.arrows?.length) scene.arrows = extra.arrows
    if (extra.pointer && a !== null) scene.pointers = [{ name: 'a', r: 0, c: a, role: 'ptrB' }]
    const vars: Record<string, Val> = { amount, a, coin, cand, best }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: solved, max: amount + 1, label: 'Amounts solved' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const coinList = coins.join(', ')
  emit('init', `Coins ${coinList}, amount ${amount}. dp[a] = fewest coins for a. Every cell starts at ∞: not reachable yet.`)

  dp[0] = 0
  solved = 1
  best = 0
  emit('base', 'dp[0] = 0: it takes no coins to make 0. Every other amount builds from this.', {
    marks: [{ r: 0, c: 0, role: 'changed' }],
    predict: amount >= 1 ? bestCoinPredict(1, coins, dp, infinity) : undefined,
  })

  for (let amt = 1; amt <= amount && !rec.capped; amt++) {
    a = amt
    best = show(dp[amt])
    for (let k = 0; k < coins.length && !rec.capped; k++) {
      const c = coins[k]
      coin = c
      if (c > amt) {
        cand = null
        emit(
          'skip',
          k === 0
            ? `No coin fits in ${amt}: the smallest is ${c}. dp[${amt}] stays ∞.`
            : `Coin ${c} is bigger than ${amt}, so it and every larger coin are out.`,
          { marks: [{ r: 0, c: amt, role: 'focus' }], pointer: true },
        )
        break
      }
      const source = dp[amt - c]
      const candidate = source + 1
      cand = show(candidate)
      const arrows: GridScene['arrows'] = [{ from: [0, amt - c], to: [0, amt] }]
      const marks: NonNullable<GridScene['marks']> = [
        { r: 0, c: amt - c, role: 'compare' },
        { r: 0, c: amt, role: 'focus' },
      ]
      emit(
        'try',
        source >= infinity
          ? `Coin ${c}: dp[${amt} − ${c}] = dp[${amt - c}] is ∞, so this way is ∞ too.`
          : `Coin ${c}: dp[${amt} − ${c}] + 1 = dp[${amt - c}] + 1 = ${source} + 1 = ${candidate} ${candidate === 1 ? 'coin' : 'coins'}.`,
        { marks, arrows, pointer: true },
      )
      if (rec.capped) break

      const before = dp[amt]
      dp[amt] = Math.min(before, candidate)
      best = show(dp[amt])
      const improved = dp[amt] < before
      emit(
        'keep',
        improved
          ? `min(${show(before)}, ${show(candidate)}) = ${show(dp[amt])}: the new way is better, so dp[${amt}] = ${show(dp[amt])}.`
          : `min(${show(before)}, ${show(candidate)}) = ${show(dp[amt])}: dp[${amt}] stays ${show(dp[amt])}.`,
        {
          marks: [{ r: 0, c: amt, role: improved ? 'changed' : 'focus' }],
          arrows,
          pointer: true,
        },
      )
    }
    solved = amt + 1
    // Ask about the next amount on this amount's last frame; its first try frame is the reveal.
    if (amt < amount && rec.frames.length > 0 && !rec.capped) {
      const ask = bestCoinPredict(amt + 1, coins, dp, infinity)
      const last = rec.frames[rec.frames.length - 1]
      if (ask && !last.predict) last.predict = ask
    }
  }

  const result = dp[amount] >= infinity ? -1 : dp[amount]
  a = null
  coin = null
  cand = null
  best = result
  emit(
    'done',
    result === -1
      ? `dp[${amount}] is still ∞: no mix of ${coinList} makes ${amount}. Return -1.`
      : `dp[${amount}] = ${result}: the fewest coins that make ${amount} is ${result}.`,
    { marks: [{ r: 0, c: amount, role: result === -1 ? 'error' : 'found' }] },
  )
  return rec.done(result)
}

/** Independent check: breadth-first search over remaining amounts (fewest coins = fewest BFS levels). */
function reference({ coins, amount }: CoinChangeInput): number {
  if (amount === 0) return 0
  const seen = new Set<number>([amount])
  let frontier = [amount]
  for (let used = 1; frontier.length > 0; used++) {
    const next: number[] = []
    for (const left of frontier) {
      for (const c of coins) {
        const rest = left - c
        if (rest === 0) return used
        if (rest > 0 && !seen.has(rest)) {
          seen.add(rest)
          next.push(rest)
        }
      }
    }
    frontier = next
  }
  return -1
}

const tracer: Tracer<CoinChangeInput, number> = {
  id: 'dynamic-programming/coin-change',
  title: 'Coin change (min over choices)',
  anchors: {
    init: 'Make a table: dp[a] = fewest coins for a, all ∞',
    base: 'Base case: dp[0] = 0, no coins make 0',
    skip: 'A coin bigger than a can\'t be used: stop',
    try: 'Try a coin: dp[a − coin] + 1 coins',
    keep: 'Keep the smaller: dp[a] = min(dp[a], candidate)',
    done: 'dp[amount], or −1 if it is still ∞',
  },
  vars: [
    { name: 'amount', role: 'value' },
    { name: 'a', role: 'ptrB' },
    { name: 'coin', role: 'focus' },
    { name: 'cand', label: 'candidate', role: 'value' },
    { name: 'best', label: 'dp[a]', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'coins', label: 'Coins', kind: 'int-array', placeholder: '1, 3, 4', help: `Up to ${MAX_COINS} different values, 1 to ${LIMITS.max}` },
      { name: 'amount', label: 'Amount', kind: 'int', placeholder: '6', help: `0 to ${MAX_AMOUNT}` },
    ],
    parse: parseInput,
    format: ({ coins, amount }) => ({ coins: coins.join(', '), amount: String(amount) }),
    presets: [
      { label: 'Greedy fails: coins 1, 3, 4 for 6', value: { coins: [1, 3, 4], amount: 6 } },
      { label: 'Coins 1, 2, 5 for 11', value: { coins: [1, 2, 5], amount: 11 } },
      { label: 'Impossible: only 2 and 4 for 7', value: { coins: [2, 4], amount: 7 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const count = randInt(rand, 1, MAX_COINS)
      const pool = Array.from({ length: LIMITS.max }, (_, i) => i + 1)
      const coins: number[] = []
      for (let k = 0; k < count; k++) coins.push(pool.splice(randInt(rand, 0, pool.length - 1), 1)[0])
      coins.sort((x, y) => x - y)
      return { coins, amount: randInt(rand, 0, MAX_AMOUNT) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
