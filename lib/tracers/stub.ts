/**
 * Placeholder tracer for golden-path ids whose lesson is not written yet.
 *
 * A stub is a valid `AnyTracer` so the registry can load every id, but `run`
 * and `reference` throw. The registry test skips stubs (`isStub`), so a lesson
 * author replaces `export default stubTracer('<id>')` with a real tracer and the
 * harness picks it up automatically.
 */
import type { AnyTracer, TracerId } from '@/lib/engine/types'

const STUB = Symbol.for('dsakarle.stub-tracer')

export type StubTracer = AnyTracer & { readonly [STUB]: true }

export function stubTracer(id: TracerId): StubTracer {
  const notImplemented = (): never => {
    throw new Error(`Tracer "${id}" is not implemented yet.`)
  }
  const tracer: AnyTracer = {
    id,
    title: id,
    anchors: {},
    vars: [],
    input: {
      fields: [],
      parse: () => ({ ok: false, error: 'This lesson is still a draft.' }),
      format: () => ({}),
      presets: [],
      random: notImplemented,
      limits: { maxN: 12, min: -99, max: 99 },
    },
    run: notImplemented,
    reference: notImplemented,
  }
  return Object.assign(tracer, { [STUB]: true as const })
}

/** True for tracers made by `stubTracer`. */
export function isStub(tracer: AnyTracer): tracer is StubTracer {
  return (tracer as Partial<StubTracer>)[STUB] === true
}
