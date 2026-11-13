/**
 * Shared tracer test harness.
 *
 * `describeTracer(tracer, opts)` registers the full contract checks for one
 * tracer. tests/tracers/registry.test.ts calls it for every non-stub tracer in
 * the registry, so a lesson author only implements lib/tracers/<id>.ts; extra,
 * tracer-specific assertions go in tests/tracers/<slug>.test.ts.
 *
 * What it checks (see docs/CONTENT_GUIDE.md "Tracers"):
 *   metadata · frames and anchors · say · scenes · predicts · input parsing ·
 *   correctness vs reference() · determinism · code files in all three languages.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseCode } from '@/lib/code/anchors'
import { CODE_EXT, LANGS, MAX_FRAMES } from '@/lib/engine/types'
import type { AnyTracer, Frame, PredictCandidate, Scene } from '@/lib/engine/types'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

/** Default number of random seeds checked for correctness and anchor coverage. */
const DEFAULT_SEEDS = 200

export interface PredictContext {
  /** All frames of this run. */
  frames: Frame[]
  /** Index of `frame` in `frames` (`next` is `frames[index + 1]`). */
  index: number
  /** The input this run used. */
  input: unknown
}

export interface DescribeTracerOptions {
  /** How many random seeds (1..seeds) to check. Default 200. */
  seeds?: number
  /**
   * Called for every frame that carries a predict, with the frame and the frame
   * after it. Assert that `frame.predict.answer` matches what actually happened.
   */
  checkPredict?: (frame: Frame & { predict: PredictCandidate }, next: Frame, ctx: PredictContext) => void
  /**
   * Extra raw inputs `parse` must reject, e.g. `{ label: 'k too big', override: { k: '99' } }`.
   * `override` is merged over the first preset's formatted text. Use it for
   * tracer-specific rules (the harness already covers empty / too long /
   * out-of-range / non-number for every field).
   */
  extraRejects?: Array<{ label: string; override: Record<string, string> }>
}

interface Run {
  label: string
  input: unknown
  frames: Frame[]
  result: unknown
}

export function describeTracer(tracer: AnyTracer, opts: DescribeTracerOptions = {}): void {
  const seeds = opts.seeds ?? DEFAULT_SEEDS
  const { input: spec } = tracer
  const anchorIds = Object.keys(tracer.anchors)

  // Runs are computed lazily so a throwing tracer fails its own tests, not collection.
  let presetRuns: Run[] | undefined
  let randomRuns: Run[] | undefined
  const runOf = (label: string, input: unknown): Run => {
    const { frames, result } = tracer.run(input)
    return { label, input, frames, result }
  }
  const getPresetRuns = (): Run[] => (presetRuns ??= spec.presets.map((p) => runOf(`preset "${p.label}"`, p.value)))
  const getRandomRuns = (): Run[] =>
    (randomRuns ??= Array.from({ length: seeds }, (_, i) => runOf(`random(${i + 1})`, spec.random(i + 1))))
  const allRuns = (): Run[] => [...getPresetRuns(), ...getRandomRuns()]

  describe(`tracer ${tracer.id}`, () => {
    // -- metadata -----------------------------------------------------------
    describe('metadata', () => {
      it('has a well-formed id, title, anchors and vars', () => {
        expect(tracer.id).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
        expect(tracer.title.trim()).not.toBe('')
        expect(anchorIds.length).toBeGreaterThan(0)
        for (const id of anchorIds) {
          expect(id, `anchor id "${id}"`).toMatch(/^[a-z0-9-]+$/)
          expect(tracer.anchors[id].trim(), `label of anchor "${id}"`).not.toBe('')
        }
        const names = tracer.vars.map((v) => v.name)
        expect(new Set(names).size, 'var names are unique').toBe(names.length)
      })

      it('offers 2-3 presets, each valid and round-tripping through parse(format(...))', () => {
        expect(spec.presets.length).toBeGreaterThanOrEqual(2)
        expect(spec.presets.length).toBeLessThanOrEqual(3)
        for (const preset of spec.presets) {
          expect(preset.label.trim()).not.toBe('')
          const parsed = spec.parse(spec.format(preset.value))
          expect(parsed.ok, `preset "${preset.label}" should parse`).toBe(true)
          if (parsed.ok) expect(parsed.value).toEqual(preset.value)
        }
      })

      it('declares a form field for every key that format() produces', () => {
        const fieldNames = spec.fields.map((f) => f.name).sort()
        for (const preset of spec.presets) expect(Object.keys(spec.format(preset.value)).sort()).toEqual(fieldNames)
      })
    })

    // -- frames ---------------------------------------------------------------
    describe('frames', () => {
      it('runs every preset with 2..MAX_FRAMES frames starting on an anchor', () => {
        for (const run of getPresetRuns()) {
          expect(run.frames.length, `${run.label} frame count`).toBeGreaterThanOrEqual(2)
          expect(run.frames.length, `${run.label} frame count`).toBeLessThanOrEqual(MAX_FRAMES)
          expect(anchorIds, `${run.label} first frame`).toContain(run.frames[0].at)
        }
      })

      it('keeps every random run within 2..MAX_FRAMES', () => {
        for (const run of getRandomRuns()) {
          expect(run.frames.length, run.label).toBeGreaterThanOrEqual(2)
          expect(run.frames.length, run.label).toBeLessThanOrEqual(MAX_FRAMES)
        }
      })

      it('only uses anchors the tracer declares', () => {
        for (const run of allRuns()) {
          run.frames.forEach((frame, i) => {
            expect(anchorIds, `${run.label} frame ${i} at "${frame.at}"`).toContain(frame.at)
          })
        }
      })

      it('uses every declared anchor in at least one frame (presets + random)', () => {
        const used = new Set<string>()
        for (const run of allRuns()) for (const frame of run.frames) used.add(frame.at)
        expect(anchorIds.filter((id) => !used.has(id)), 'anchors never used by any frame').toEqual([])
      })

      it('shows every anchor in the first preset (the guided run)', () => {
        const used = new Set(getPresetRuns()[0].frames.map((f) => f.at))
        expect(anchorIds.filter((id) => !used.has(id)), 'anchors missing from the default preset').toEqual([])
      })

      it('only reports declared variables', () => {
        const names = new Set(tracer.vars.map((v) => v.name))
        for (const run of getPresetRuns()) {
          run.frames.forEach((frame, i) => {
            for (const key of Object.keys(frame.vars)) {
              expect(names.has(key), `${run.label} frame ${i}: unknown var "${key}"`).toBe(true)
            }
          })
        }
      })

      it('records plain JSON frames (no undefined, NaN, Infinity or class instances)', () => {
        for (const run of allRuns()) expect(JSON.parse(JSON.stringify(run.frames)), run.label).toEqual(run.frames)
      })
    })

    // -- narration --------------------------------------------------------------
    describe('say', () => {
      it('is non-empty, at most 140 characters, and never says "Step N"', () => {
        for (const run of allRuns()) {
          run.frames.forEach((frame, i) => {
            const where = `${run.label} frame ${i}`
            expect(frame.say.trim().length, `${where} say is empty`).toBeGreaterThan(0)
            expect(frame.say.length, `${where} say too long: "${frame.say}"`).toBeLessThanOrEqual(140)
            expect(frame.say, `${where} says "Step N"`).not.toMatch(/\bstep\s*\d/i)
          })
        }
      })
    })

    // -- scenes -------------------------------------------------------------
    describe('scenes', () => {
      it('keeps array pointers, windows and marks in range', () => {
        for (const run of allRuns()) {
          run.frames.forEach((frame, i) => checkScene(frame.scene, `${run.label} frame ${i}`))
        }
      })
    })

    // -- predicts -----------------------------------------------------------
    describe('predicts', () => {
      it('are well formed and always have a frame to reveal', () => {
        for (const run of allRuns()) {
          run.frames.forEach((frame, i) => {
            const p = frame.predict
            if (!p) return
            const where = `${run.label} frame ${i} predict`
            expect(i, `${where}: no frame after it to reveal`).toBeLessThan(run.frames.length - 1)
            expect(p.tag.trim(), `${where} tag`).not.toBe('')
            expect(p.prompt.trim(), `${where} prompt`).not.toBe('')
            expect(p.why.trim(), `${where} why`).not.toBe('')
            expect(p.answer, `${where} answer`).toBeDefined()
            if (p.kind === 'choice') {
              expect(p.options, `${where} options`).toBeDefined()
              expect(p.options!.length, `${where} options`).toBeGreaterThanOrEqual(2)
              expect(p.options, `${where}: answer must be one of the options`).toContain(p.answer)
            } else {
              expect(['number', 'string']).toContain(typeof p.answer)
              if (typeof p.answer === 'number' && frame.scene.kind === 'array') {
                expect(Number.isInteger(p.answer) && p.answer >= 0 && p.answer < frame.scene.cells.length, `${where}: cell answer in range`).toBe(true)
              }
            }
          })
        }
      })

      it('are emitted somewhere in the default preset', () => {
        expect(getPresetRuns()[0].frames.some((f) => f.predict), 'default preset has no predict candidates').toBe(true)
      })

      if (opts.checkPredict) {
        const check = opts.checkPredict
        it('match what actually happens (tracer-specific checkPredict)', () => {
          for (const run of allRuns()) {
            run.frames.forEach((frame, index) => {
              if (!frame.predict) return
              check(frame as Frame & { predict: PredictCandidate }, run.frames[index + 1], {
                frames: run.frames,
                index,
                input: run.input,
              })
            })
          }
        })
      }
    })

    // -- input ----------------------------------------------------------------
    describe('input', () => {
      it('rejects bad input with a friendly error and never throws', () => {
        const base = spec.format(spec.presets[0].value)
        const cases: Array<{ label: string; raw: Record<string, string> }> = []
        const safeNumber = String(Math.min(Math.max(1, spec.limits.min), spec.limits.max))

        for (const field of spec.fields) {
          const set = (value: string, label: string): void => {
            cases.push({ label: `${field.name}: ${label}`, raw: { ...base, [field.name]: value } })
          }
          set('', 'empty')
          if (field.kind === 'int-array') {
            const items = base[field.name].split(/[,\s]+/).filter(Boolean)
            set(Array.from({ length: spec.limits.maxN + 1 }, () => safeNumber).join(', '), `more than ${spec.limits.maxN} values`)
            set([String(spec.limits.max + 1), ...items.slice(1)].join(', '), `value above ${spec.limits.max}`)
            set([String(spec.limits.min - 1), ...items.slice(1)].join(', '), `value below ${spec.limits.min}`)
            set('abc', 'not numbers')
            set(['x', ...items.slice(1)].join(', '), 'one non-number among numbers')
            set([...items, '1.5'].join(', '), 'decimal')
          } else if (field.kind === 'int') {
            set('abc', 'not a number')
            set('1.5', 'decimal')
          } else if (field.kind === 'string') {
            set('a'.repeat(spec.limits.maxN + 1), `longer than ${spec.limits.maxN}`)
          } else if (field.kind === 'string-array') {
            set(Array.from({ length: spec.limits.maxN + 1 }, () => 'a').join(', '), `more than ${spec.limits.maxN} items`)
          }
        }
        for (const extra of opts.extraRejects ?? []) {
          cases.push({ label: extra.label, raw: { ...base, ...extra.override } })
        }

        const fieldNames = new Set(spec.fields.map((f) => f.name))
        for (const { label, raw } of cases) {
          const result = spec.parse(raw)
          expect(result.ok, `parse should reject "${label}"`).toBe(false)
          if (result.ok) continue
          expect(result.error.trim().length, `${label}: error message`).toBeGreaterThan(0)
          expect(result.error.length, `${label}: error is too long to be friendly`).toBeLessThanOrEqual(140)
          expect(result.error, `${label}: error leaks internals`).not.toMatch(/undefined|NaN|\[object|\bError:/)
          if (result.field !== undefined) expect(fieldNames.has(result.field), `${label}: unknown field "${result.field}"`).toBe(true)
        }
      })

      it('random(seed) is deterministic and varied', () => {
        const seen = new Set<string>()
        for (let seed = 1; seed <= seeds; seed++) {
          const a = spec.random(seed)
          expect(spec.random(seed), `random(${seed}) is not deterministic`).toEqual(a)
          seen.add(JSON.stringify(a))
        }
        expect(seen.size, 'random(seed) barely varies').toBeGreaterThanOrEqual(Math.min(20, seeds, spec.space ?? Infinity))
      })
    })

    // -- correctness --------------------------------------------------------
    describe('correctness', () => {
      it(`random inputs (seeds 1..${seeds}) round-trip through format/parse and match reference()`, () => {
        for (let seed = 1; seed <= seeds; seed++) {
          const input = spec.random(seed)
          const parsed = spec.parse(spec.format(input))
          expect(parsed.ok, `random(${seed}) should parse: ${JSON.stringify(spec.format(input))}`).toBe(true)
          if (!parsed.ok) continue
          expect(parsed.value, `random(${seed}) parse(format(x)) differs`).toEqual(input)
          expect(tracer.run(input).result, `random(${seed}) ${JSON.stringify(input)}`).toEqual(tracer.reference(input))
        }
      })

      it('presets match reference()', () => {
        for (const run of getPresetRuns()) expect(run.result, run.label).toEqual(tracer.reference(run.input))
      })

      it('is deterministic and does not mutate its input', () => {
        for (const preset of spec.presets) {
          const before = structuredClone(preset.value)
          const first = tracer.run(preset.value)
          const second = tracer.run(preset.value)
          expect(second, `preset "${preset.label}" differs between runs`).toEqual(first)
          expect(preset.value, `preset "${preset.label}" was mutated by run()`).toEqual(before)
        }
        for (let seed = 1; seed <= Math.min(seeds, 50); seed++) {
          const input = spec.random(seed)
          expect(tracer.run(input), `random(${seed}) differs between runs`).toEqual(tracer.run(input))
        }
      })
    })

    // -- code files -----------------------------------------------------------
    describe('code files', () => {
      for (const lang of LANGS) {
        it(`content/code/${tracer.id}.${CODE_EXT[lang]} exists and has exactly the tracer's anchors`, () => {
          const file = `${REPO_ROOT}content/code/${tracer.id}.${CODE_EXT[lang]}`
          expect(fs.existsSync(file), `missing ${file}`).toBe(true)
          const parsed = parseCode(fs.readFileSync(file, 'utf8'), lang)
          expect(parsed.source.trim(), 'code file is empty').not.toBe('')
          expect(Object.keys(parsed.anchors).sort(), `${lang} anchors vs tracer.anchors`).toEqual([...anchorIds].sort())
          expect(parsed.source, 'an anchor marker was left in the displayed source').not.toMatch(/@(?:init|expand|shrink|record|done)\b/)
        })
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Scene checks
// ---------------------------------------------------------------------------

function checkScene(scene: Scene, where: string): void {
  if (scene.kind === 'composite') {
    scene.parts.forEach((part, i) => checkScene(part.scene, `${where} part ${i}`))
    return
  }
  if (scene.kind !== 'array') return // other kinds get checks when their phase lands

  const n = scene.cells.length
  for (const p of scene.pointers ?? []) {
    expect(Number.isInteger(p.index), `${where}: pointer "${p.name}" index ${p.index}`).toBe(true)
    expect(p.index, `${where}: pointer "${p.name}" index`).toBeGreaterThanOrEqual(-1)
    expect(p.index, `${where}: pointer "${p.name}" index`).toBeLessThanOrEqual(n)
  }
  if (scene.window) {
    const { start, end } = scene.window
    expect(start, `${where}: window start`).toBeGreaterThanOrEqual(0)
    expect(end, `${where}: window end`).toBeLessThanOrEqual(n - 1)
    expect(start, `${where}: window start <= end`).toBeLessThanOrEqual(end)
  }
  for (const m of scene.marks ?? []) {
    expect(Number.isInteger(m.index) && m.index >= 0 && m.index < n, `${where}: mark index ${m.index} (role ${m.role}) out of 0..${n - 1}`).toBe(true)
  }
}
