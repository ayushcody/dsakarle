/**
 * Extra checks for the dynamic-programming tracers (climb-stairs, unique-paths,
 * coin-change). The generic contract suite runs from registry.test.ts; this file
 * checks the grid scenes (marks, arrows, pointers and note targets in range),
 * that each table is filled by the recurrence it claims, that predict answers
 * are true, the teaching beats of the default presets, and the input limits.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import climb from '@/lib/tracers/dynamic-programming/climb-stairs'
import type { ClimbStairsInput } from '@/lib/tracers/dynamic-programming/climb-stairs'
import paths from '@/lib/tracers/dynamic-programming/unique-paths'
import type { UniquePathsInput } from '@/lib/tracers/dynamic-programming/unique-paths'
import coin from '@/lib/tracers/dynamic-programming/coin-change'
import type { CoinChangeInput } from '@/lib/tracers/dynamic-programming/coin-change'
import knapsack from '@/lib/tracers/dynamic-programming/knapsack'
import type { KnapsackInput } from '@/lib/tracers/dynamic-programming/knapsack'
import lcs from '@/lib/tracers/dynamic-programming/lcs'
import type { LcsInput } from '@/lib/tracers/dynamic-programming/lcs'
import type { AnyTracer, Frame, GridScene } from '@/lib/engine/types'

function grid(frame: Frame): GridScene {
  if (frame.scene.kind !== 'grid') throw new Error('expected a grid scene')
  return frame.scene
}

function cellsWith(frame: Frame, role: string): Array<[number, number]> {
  return (grid(frame).marks ?? []).filter((m) => m.role === role).map((m): [number, number] => [m.r, m.c])
}

function runsOf<I>(tracer: AnyTracer): Array<{ input: I; frames: Frame[]; result: unknown }> {
  const inputs: I[] = [...tracer.input.presets.map((p: { value: I }) => p.value), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1) as I)]
  return inputs.map((input) => ({ input, ...tracer.run(input) }))
}

/** Structural checks for any grid frame: marks, pointers, arrows, note targets all inside the table. */
function checkGrid(frame: Frame, where: string): void {
  const g = grid(frame)
  const R = g.rows.length
  const C = g.rows[0].length
  expect(g.rows.every((row) => row.length === C), `${where}: rectangular`).toBe(true)
  const inside = (r: number, c: number): boolean => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < R && c >= 0 && c < C
  for (const m of g.marks ?? []) expect(inside(m.r, m.c), `${where}: mark ${m.r},${m.c}`).toBe(true)
  for (const p of g.pointers ?? []) expect(inside(p.r, p.c), `${where}: pointer ${p.name}`).toBe(true)
  for (const a of g.arrows ?? []) {
    expect(inside(a.from[0], a.from[1]) && inside(a.to[0], a.to[1]), `${where}: arrow`).toBe(true)
    expect(a.from[0] <= a.to[0] && a.from[1] <= a.to[1] && (a.from[0] !== a.to[0] || a.from[1] !== a.to[1]), `${where}: arrows point down/right`).toBe(true)
  }
  for (const n of g.annotations ?? []) {
    const match = /^cell:(\d+),(\d+)$/.exec(n.target)
    expect(match, `${where}: annotation target ${n.target}`).not.toBeNull()
    if (match) expect(inside(Number(match[1]), Number(match[2])), `${where}: annotation in range`).toBe(true)
  }
  if (g.rowLabels) expect(g.rowLabels).toHaveLength(R)
  if (g.colLabels) expect(g.colLabels).toHaveLength(C)
}

// ===========================================================================
// dynamic-programming/climb-stairs
// ===========================================================================

const climbDefault = climb.input.presets[0].value as ClimbStairsInput

describe('climb-stairs: default preset', () => {
  const { frames, result } = climb.run(climbDefault)

  it('is the 10-stair puzzle from the hook: 89 ways', () => {
    expect(climbDefault).toEqual({ n: 10 })
    expect(result).toBe(89)
  })

  it('fills dp as the Fibonacci-like row 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89', () => {
    expect(grid(frames[frames.length - 1]).rows).toEqual([[1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]])
  })

  it('walks init, base, 9 look + fill pairs, done (21 frames)', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(21)
    expect([count('init'), count('base'), count('look'), count('fill'), count('done')]).toEqual([1, 1, 9, 9, 1])
  })

  it('starts with an empty table', () => {
    expect(grid(frames[0]).rows).toEqual([Array(11).fill(null)])
  })
})

describe('climb-stairs: scenes and recurrence', () => {
  const runs = runsOf<ClimbStairsInput>(climb)

  it('keep marks, pointers and arrows inside the table', () => {
    for (const { frames } of runs) frames.forEach((f, i) => checkGrid(f, `frame ${i}`))
  })

  it('look frames draw exactly the arrows from i-1 and i-2 and compare those two cells', () => {
    for (const { frames } of runs) {
      for (const f of frames.filter((x) => x.at === 'look')) {
        const i = f.vars.i as number
        const g = grid(f)
        expect(g.arrows).toEqual([{ from: [0, i - 1], to: [0, i] }, { from: [0, i - 2], to: [0, i] }])
        expect(cellsWith(f, 'compare')).toEqual([[0, i - 1], [0, i - 2]])
        expect(cellsWith(f, 'focus')).toEqual([[0, i]])
        expect(g.rows[0][i]).toBeNull()
      }
    }
  })

  it('fill frames set dp[i] = dp[i-1] + dp[i-2] and flash it as changed', () => {
    for (const { frames } of runs) {
      for (const f of frames.filter((x) => x.at === 'fill')) {
        const i = f.vars.i as number
        const row = grid(f).rows[0] as number[]
        expect(row[i]).toBe(row[i - 1] + row[i - 2])
        expect(cellsWith(f, 'changed')).toEqual([[0, i]])
      }
    }
  })

  it('ends with dp[n] marked found and as the result', () => {
    for (const { input, frames, result } of runs) {
      const done = frames[frames.length - 1]
      expect(done.at).toBe('done')
      expect(cellsWith(done, 'found')).toEqual([[0, input.n]])
      expect(grid(done).rows[0][input.n]).toBe(result)
    }
  })

  it('rejects zero, too many stairs and fractions kindly', () => {
    for (const n of ['0', '21', '-3', '2.5', 'ten', '']) expect(climb.input.parse({ n }).ok, `n = "${n}"`).toBe(false)
    expect(climb.input.parse({ n: '20' }).ok).toBe(true)
  })
})

describe('climb-stairs: predicts tell the truth', () => {
  it('next-value: the answer is the sum, it is among three distinct options, and the next frame writes it', () => {
    let asked = 0
    const positions = new Set<number>()
    for (const { frames } of runsOf<ClimbStairsInput>(climb)) {
      frames.forEach((f, idx) => {
        if (!f.predict) return
        asked++
        expect(f.at).toBe('look')
        expect(f.predict.tag).toBe('next-value')
        expect(f.predict.options).toHaveLength(3)
        expect(new Set(f.predict.options).size).toBe(3)
        positions.add(f.predict.options!.indexOf(f.predict.answer as string))
        const i = f.vars.i as number
        const next = frames[idx + 1]
        expect(next.at).toBe('fill')
        expect(String(grid(next).rows[0][i])).toBe(f.predict.answer)
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(positions.size, 'the right option moves around').toBe(3)
  })
})

// ===========================================================================
// dynamic-programming/unique-paths
// ===========================================================================

const pathsDefault = paths.input.presets[0].value as UniquePathsInput

describe('unique-paths: default preset', () => {
  const { frames, result } = paths.run(pathsDefault)

  it('is a 3 × 4 grid with 10 paths and this exact table', () => {
    expect(pathsDefault).toEqual({ m: 3, n: 4 })
    expect(result).toBe(10)
    expect(grid(frames[frames.length - 1]).rows).toEqual([
      [1, 1, 1, 1],
      [1, 2, 3, 4],
      [1, 3, 6, 10],
    ])
  })

  it('walks init, base, 6 look + fill pairs, done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(15)
    expect([count('init'), count('base'), count('look'), count('fill'), count('done')]).toEqual([1, 1, 6, 6, 1])
  })

  it('the base frame fills the whole first row and column at once', () => {
    const base = frames.find((f) => f.at === 'base')!
    expect(grid(base).rows).toEqual([
      [1, 1, 1, 1],
      [1, null, null, null],
      [1, null, null, null],
    ])
    expect(cellsWith(base, 'changed')).toHaveLength(6)
  })
})

describe('unique-paths: scenes and recurrence', () => {
  const runs = runsOf<UniquePathsInput>(paths)

  it('keep marks, arrows and note targets inside the table', () => {
    for (const { frames } of runs) frames.forEach((f, i) => checkGrid(f, `frame ${i}`))
  })

  it('look frames draw the up and left arrows into the focus cell', () => {
    for (const { frames } of runs) {
      for (const f of frames.filter((x) => x.at === 'look')) {
        const r = f.vars.r as number
        const c = f.vars.c as number
        const g = grid(f)
        expect(g.arrows).toEqual([{ from: [r - 1, c], to: [r, c] }, { from: [r, c - 1], to: [r, c] }])
        expect(cellsWith(f, 'focus')).toEqual([[r, c]])
        expect(g.rows[r][c]).toBeNull()
        expect(g.rows[r - 1][c]).toBe(f.vars.up)
        expect(g.rows[r][c - 1]).toBe(f.vars.left)
      }
    }
  })

  it('fill frames set dp[r][c] = up + left; every cell is filled exactly once in row-major order', () => {
    for (const { input, frames } of runs) {
      const order = frames.filter((f) => f.at === 'fill').map((f) => [f.vars.r, f.vars.c])
      const expected: number[][] = []
      for (let r = 1; r < input.m; r++) for (let c = 1; c < input.n; c++) expected.push([r, c])
      expect(order).toEqual(expected)
      for (const f of frames.filter((x) => x.at === 'fill')) {
        const r = f.vars.r as number
        const c = f.vars.c as number
        const rows = grid(f).rows as number[][]
        expect(rows[r][c]).toBe(rows[r - 1][c] + rows[r][c - 1])
      }
    }
  })

  it('ends with the corner marked found and a complete table', () => {
    for (const { input, frames, result } of runs) {
      const done = frames[frames.length - 1]
      expect(cellsWith(done, 'found')).toEqual([[input.m - 1, input.n - 1]])
      expect(grid(done).rows.flat().every((v) => typeof v === 'number')).toBe(true)
      expect(grid(done).rows[input.m - 1][input.n - 1]).toBe(result)
    }
  })

  it('rejects zero, seven, fractions and words kindly', () => {
    for (const bad of [{ m: '0', n: '3' }, { m: '7', n: '3' }, { m: '3', n: '0' }, { m: '3', n: '7' }, { m: '1.5', n: '3' }, { m: '3', n: 'x' }, { m: '', n: '3' }]) {
      expect(paths.input.parse(bad).ok, JSON.stringify(bad)).toBe(false)
    }
    expect(paths.input.parse({ m: '6', n: '6' }).ok).toBe(true)
  })
})

describe('unique-paths: predicts tell the truth', () => {
  it('next-value: the sum of up and left is what the next frame writes', () => {
    let asked = 0
    for (const { frames } of runsOf<UniquePathsInput>(paths)) {
      frames.forEach((f, idx) => {
        if (f.predict?.tag !== 'next-value') return
        asked++
        expect(f.at).toBe('look')
        expect(f.predict.options).toHaveLength(3)
        expect(new Set(f.predict.options).size).toBe(3)
        const r = f.vars.r as number
        const c = f.vars.c as number
        expect(String(grid(frames[idx + 1]).rows[r][c])).toBe(f.predict.answer)
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('which-cells: the answer is the cell above the next focus cell, and the next frame arrows from it', () => {
    let asked = 0
    for (const { frames } of runsOf<UniquePathsInput>(paths)) {
      frames.forEach((f, idx) => {
        if (f.predict?.tag !== 'which-cells') return
        asked++
        expect(f.predict.kind).toBe('cell')
        expect(['base', 'fill']).toContain(f.at)
        const next = frames[idx + 1]
        expect(next.at).toBe('look')
        const r = next.vars.r as number
        const c = next.vars.c as number
        expect(f.predict.answer).toBe(`${r - 1},${c}`)
        expect(grid(next).arrows).toContainEqual({ from: [r - 1, c], to: [r, c] })
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('which-cells is asked before every look frame', () => {
    for (const { frames } of runsOf<UniquePathsInput>(paths)) {
      frames.forEach((f, idx) => {
        if (f.at === 'look') expect(frames[idx - 1].predict?.tag).toBe('which-cells')
      })
    }
  })
})

// ===========================================================================
// dynamic-programming/coin-change
// ===========================================================================

const coinDefault = coin.input.presets[0].value as CoinChangeInput

describe('coin-change: default preset', () => {
  const { frames, result } = coin.run(coinDefault)

  it('is the greedy counterexample: coins 1, 3, 4 and amount 6 need 2 coins (greedy takes 3)', () => {
    expect(coinDefault).toEqual({ coins: [1, 3, 4], amount: 6 })
    expect(result).toBe(2)
    expect(grid(frames[frames.length - 1]).rows).toEqual([[0, 1, 2, 1, 1, 2, 2]])
  })

  it('starts at infinity everywhere except dp[0]', () => {
    expect(grid(frames[0]).rows).toEqual([['∞', '∞', '∞', '∞', '∞', '∞', '∞']])
    expect(grid(frames[1]).rows).toEqual([[0, '∞', '∞', '∞', '∞', '∞', '∞']])
  })

  it('shows every rule: init, base, 3 skips, 13 tries, 13 keeps, done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('base'), count('skip'), count('try'), count('keep'), count('done')]).toEqual([1, 1, 3, 13, 13, 1])
  })

  it('the default preset has a "never better" keep and an improving keep', () => {
    const keeps = frames.filter((f) => f.at === 'keep')
    expect(keeps.some((f) => /stays/.test(f.say))).toBe(true)
    expect(keeps.some((f) => /new way is better/.test(f.say))).toBe(true)
  })
})

describe('coin-change: other presets', () => {
  it('the impossible preset ends with infinity at dp[7], marked as an error, returning -1', () => {
    const preset = coin.input.presets[2].value as CoinChangeInput
    const { frames, result } = coin.run(preset)
    expect(result).toBe(-1)
    const done = frames[frames.length - 1]
    expect(grid(done).rows[0][7]).toBe('∞')
    expect(cellsWith(done, 'error')).toEqual([[0, 7]])
    expect(done.say).toMatch(/Return -1/)
  })

  it('amount 0 needs no coins: one init, one base, done', () => {
    const { frames, result } = coin.run({ coins: [2, 5], amount: 0 })
    expect(result).toBe(0)
    expect(frames.map((f) => f.at)).toEqual(['init', 'base', 'done'])
  })

  it('1, 2, 5 for 11 takes 3 coins', () => {
    expect(coin.run({ coins: [1, 2, 5], amount: 11 }).result).toBe(3)
  })
})

describe('coin-change: scenes and recurrence', () => {
  const runs = runsOf<CoinChangeInput>(coin)

  it('keep marks, pointers and arrows inside the table', () => {
    for (const { frames } of runs) frames.forEach((f, i) => checkGrid(f, `frame ${i}`))
  })

  it('never puts Infinity or NaN in a cell: unreachable amounts show the string ∞', () => {
    for (const { frames } of runs) {
      for (const f of frames) for (const v of grid(f).rows[0]) expect(typeof v === 'number' ? Number.isFinite(v) : v === '∞').toBe(true)
    }
  })

  it('try frames arrow from dp[a - coin] to dp[a] and compare the source cell', () => {
    for (const { frames } of runs) {
      for (const f of frames.filter((x) => x.at === 'try')) {
        const a = f.vars.a as number
        const c = f.vars.coin as number
        expect(grid(f).arrows).toEqual([{ from: [0, a - c], to: [0, a] }])
        expect(cellsWith(f, 'compare')).toEqual([[0, a - c]])
        expect(cellsWith(f, 'focus')).toEqual([[0, a]])
        expect(c).toBeLessThanOrEqual(a)
      }
    }
  })

  it('keep frames keep the minimum: dp[a] never goes up, and equals min(old, candidate)', () => {
    for (const { frames } of runs) {
      frames.forEach((f, i) => {
        if (f.at !== 'keep') return
        const a = f.vars.a as number
        const before = grid(frames[i - 1]).rows[0][a]
        const after = grid(f).rows[0][a]
        const cand = frames[i - 1].vars.cand
        const num = (v: unknown): number => (v === '∞' ? Infinity : (v as number))
        expect(num(after)).toBe(Math.min(num(before), num(cand)))
        expect(cellsWith(f, 'changed').length === 1).toBe(num(after) < num(before))
      })
    }
  })

  it('skip frames fire only when a coin is bigger than the amount, once per amount', () => {
    for (const { frames } of runs) {
      const seen = new Set<unknown>()
      for (const f of frames.filter((x) => x.at === 'skip')) {
        expect(f.vars.coin as number).toBeGreaterThan(f.vars.a as number)
        expect(seen.has(f.vars.a)).toBe(false)
        seen.add(f.vars.a)
      }
    }
  })

  it('the result is -1 exactly when dp[amount] ends as infinity', () => {
    for (const { input, frames, result } of runs) {
      const last = grid(frames[frames.length - 1]).rows[0][input.amount]
      expect(result === -1).toBe(last === '∞')
      if (result !== -1) expect(last).toBe(result)
    }
  })

  it('parse sorts coins and rejects duplicates, 5 coins, big amounts and bad coins', () => {
    expect(coin.input.parse({ coins: '4, 1, 3', amount: '6' })).toEqual({ ok: true, value: { coins: [1, 3, 4], amount: 6 } })
    for (const bad of [
      { coins: '1, 1', amount: '6' },
      { coins: '1, 2, 3, 4, 5', amount: '6' },
      { coins: '1, 11', amount: '6' },
      { coins: '0, 2', amount: '6' },
      { coins: '1, 3', amount: '16' },
      { coins: '1, 3', amount: '-1' },
      { coins: '1, 3', amount: '' },
    ]) {
      expect(coin.input.parse(bad).ok, JSON.stringify(bad)).toBe(false)
    }
    expect(coin.input.parse({ coins: '1, 3', amount: '0' }).ok).toBe(true)
  })
})

describe('coin-change: predicts tell the truth', () => {
  it('best-coin: the answer is the unique coin with the smallest dp[a - coin] + 1, and the next frame is that amount', () => {
    let asked = 0
    for (const { frames } of runsOf<CoinChangeInput>(coin)) {
      frames.forEach((f, idx) => {
        if (!f.predict) return
        asked++
        expect(f.predict.tag).toBe('best-coin')
        expect(f.predict.kind).toBe('choice')
        const next = frames[idx + 1]
        const a = next.vars.a as number
        const row = grid(f).rows[0]
        const infinity = row.length // amount + 1
        const options = f.predict.options as string[]
        const cands = options
          .map((o) => Number(o.replace('Coin ', '')))
          .filter((c) => c <= a && row[a - c] !== '∞')
          .map((c) => ({ c, n: (row[a - c] as number) + 1 }))
        expect(infinity).toBeGreaterThan(a)
        const best = Math.min(...cands.map((x) => x.n))
        const winners = cands.filter((x) => x.n === best)
        expect(winners, `amount ${a}: best coin is unique`).toHaveLength(1)
        expect(f.predict.answer).toBe(`Coin ${winners[0].c}`)
        expect(cands.length).toBeGreaterThanOrEqual(2)
        // The amount's first frame is a try (or skip) at the amount the question is about.
        expect(['try', 'skip']).toContain(next.at)
        expect(f.predict.prompt).toContain(`make ${a},`)
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('the default preset asks about at least one amount', () => {
    expect(coin.run(coinDefault).frames.some((f) => f.predict)).toBe(true)
  })
})

// ===========================================================================
// dynamic-programming/knapsack
// ===========================================================================

describe('knapsack: grid scenes and recurrence', () => {
  it('keeps every grid inside 8 x 8 with valid marks and arrows', () => {
    for (const { frames } of runsOf<KnapsackInput>(knapsack)) {
      frames.forEach((f, idx) => {
        checkGrid(f, `knapsack frame ${idx}`)
        const g = grid(f)
        expect(g.rows.length).toBeLessThanOrEqual(8)
        expect(g.rows[0].length).toBeLessThanOrEqual(8)
      })
    }
  })

  it('fills each cell from skip or take, and predicts tell the truth', () => {
    let asked = 0
    for (const { input, frames } of runsOf<KnapsackInput>(knapsack)) {
      const { weights, values } = input
      frames.forEach((f, idx) => {
        if (f.at === 'pick') {
          const i = f.vars.i as number
          const w = f.vars.w as number
          const g = grid(f)
          const skip = g.rows[i - 1][w] as number
          const take = (g.rows[i - 1][w - weights[i - 1]] as number) + values[i - 1]
          expect(g.rows[i][w]).toBe(Math.max(skip, take))
        }
        if (!f.predict) return
        asked++
        expect(f.predict.tag).toBe('take-or-skip')
        const next = frames[idx + 1]
        expect(f.at).toBe('look')
        expect(next.at).toBe('pick')
        const i = f.vars.i as number
        const w = f.vars.w as number
        const g = grid(next)
        const skip = g.rows[i - 1][w] as number
        const tookIt = g.rows[i][w] !== skip
        expect(f.predict.answer).toBe(tookIt ? 'Take it' : 'Skip it')
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('the guided preset uses every rule and stays short', () => {
    const { frames } = knapsack.run(knapsack.input.presets[0].value)
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(knapsack.anchors)))
    expect(frames.length).toBeLessThanOrEqual(45)
  })

  it('rejects mismatched lengths and big capacities', () => {
    expect(knapsack.input.parse({ weights: '1, 2', values: '3', capacity: '4' }).ok).toBe(false)
    expect(knapsack.input.parse({ weights: '1, 2', values: '3, 4', capacity: '8' }).ok).toBe(false)
    expect(knapsack.input.parse({ weights: '1, 2', values: '3, 4', capacity: '0' }).ok).toBe(false)
    expect(knapsack.input.parse({ weights: '1, 2', values: '3, 4', capacity: '7' }).ok).toBe(true)
  })
})

// ===========================================================================
// dynamic-programming/lcs
// ===========================================================================

describe('lcs: grid scenes, traceback and predicts', () => {
  it('keeps every grid inside 8 x 8 with valid marks and arrows', () => {
    for (const { frames } of runsOf<LcsInput>(lcs)) {
      frames.forEach((f, idx) => {
        checkGrid(f, `lcs frame ${idx}`)
        expect(grid(f).rows.length).toBeLessThanOrEqual(8)
        expect(grid(f).rows[0].length).toBeLessThanOrEqual(8)
      })
    }
  })

  it('match / mismatch frames follow the recurrence and predicts tell the truth', () => {
    let asked = 0
    for (const { input, frames } of runsOf<LcsInput>(lcs)) {
      frames.forEach((f, idx) => {
        if (f.at === 'match' || f.at === 'mismatch') {
          const i = f.vars.i as number
          const j = f.vars.j as number
          const g = grid(f)
          const same = input.a[i - 1] === input.b[j - 1]
          expect(f.at).toBe(same ? 'match' : 'mismatch')
          const expected = same ? (g.rows[i - 1][j - 1] as number) + 1 : Math.max(g.rows[i - 1][j] as number, g.rows[i][j - 1] as number)
          expect(g.rows[i][j]).toBe(expected)
          expect(cellsWith(f, 'found').length > 0).toBe(same)
        }
        if (!f.predict) return
        asked++
        expect(f.predict.tag).toBe('match-or-max')
        expect(f.predict.answer).toBe(frames[idx + 1].at === 'match' ? 'Match: diagonal + 1' : 'No match: max of up and left')
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('the traceback ends at the top or left edge and the LCS has the right length', () => {
    for (const { input, frames, result } of runsOf<LcsInput>(lcs)) {
      const last = frames[frames.length - 1]
      expect(last.at).toBe('done')
      const traceFrames = frames.filter((f) => f.at === 'trace')
      expect(traceFrames.length).toBeGreaterThanOrEqual(1)
      const path = cellsWith(traceFrames[traceFrames.length - 1], 'found')
      const [r, c] = path[path.length - 1]
      expect(r === 0 || c === 0).toBe(true)
      expect(path[0]).toEqual([input.a.length, input.b.length])
      expect(traceFrames.length).toBeLessThanOrEqual(input.a.length + input.b.length + 1)
      expect(grid(last).rows[input.a.length][input.b.length]).toBe(result)
    }
  })

  it('the guided preset uses every rule and stays short', () => {
    const { frames } = lcs.run(lcs.input.presets[0].value)
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(lcs.anchors)))
    expect(frames.length).toBeLessThanOrEqual(50)
  })

  it('rejects non-letters and upper-cases the words', () => {
    expect(lcs.input.parse({ a: 'ab1', b: 'abc' }).ok).toBe(false)
    expect(lcs.input.parse({ a: 'a b', b: 'abc' }).ok).toBe(false)
    expect(lcs.input.parse({ a: 'abc', b: 'bcd' })).toEqual({ ok: true, value: { a: 'ABC', b: 'BCD' } })
  })
})

// ===========================================================================
// content/topics/dynamic-programming.json
// ===========================================================================

describe('content/topics/dynamic-programming.json', () => {
  const lesson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/topics/dynamic-programming.json', import.meta.url)), 'utf8'))

  it('draws the shape as a grid whose callouts point at real cells, with arrows into the focus cell', () => {
    const scene = lesson.shape.scene as GridScene
    expect(scene.kind).toBe('grid')
    for (const callout of lesson.shape.callouts as Array<{ target: string; text: string }>) {
      const match = /^cell:(\d+),(\d+)$/.exec(callout.target)
      expect(match, callout.target).not.toBeNull()
      expect(scene.rows[Number(match![1])]?.length, callout.target).toBeGreaterThan(Number(match![2]))
      expect(callout.text.split(/\s+/).length).toBeLessThanOrEqual(6)
    }
    expect(scene.arrows).toHaveLength(2)
  })

  it('asks only predict tags that each track\'s guided run really emits', () => {
    const byId: Record<string, AnyTracer> = {
      'dynamic-programming/climb-stairs': climb,
      'dynamic-programming/unique-paths': paths,
      'dynamic-programming/coin-change': coin,
      'dynamic-programming/knapsack': knapsack,
      'dynamic-programming/lcs': lcs,
    }
    for (const track of lesson.stage.tracks as Array<{ tracer: string; preset?: number; predict?: { tags: string[] } }>) {
      const tracer = byId[track.tracer]
      const frames = tracer.run(tracer.input.presets[track.preset ?? 0].value).frames
      const emitted = new Set(frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
      for (const tag of track.predict?.tags ?? []) expect(emitted.has(tag), `${track.tracer} emits ${tag}`).toBe(true)
    }
  })

  it('ties the template to unique-paths: every pseudocode anchor is one of its rules and every rule has a line', () => {
    const anchors = Object.keys(paths.anchors).sort()
    const used = new Set((lesson.template.pseudocode as Array<{ anchor?: string }>).flatMap((l) => (l.anchor ? [l.anchor] : [])))
    expect([...used].sort()).toEqual(anchors)
  })
})
