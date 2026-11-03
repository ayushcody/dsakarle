'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Button, Chip, cn } from '@/components/ui'
import type { AnyTracer, InputField, InputLimits } from '@/lib/engine/types'

export interface PlaygroundInputProps {
  tracer: AnyTracer
  /** Preset index the form starts from. */
  presetIndex?: number
  /** Run the tracer on a parsed input. Return a friendly message if it could not run, else null. */
  /** Text the form starts with instead of the preset (e.g. the learner's last run). */
  initialValues?: Record<string, string>
  onRun: (input: unknown, raw: Record<string, string>) => string | null
  className?: string
}

/** "Up to 12 numbers between -99 and 99" from the tracer's limits and field kinds. */
function limitsHint(fields: InputField[], l: InputLimits): string {
  const arrayField = fields.find((f) => f.kind === 'int-array' || f.kind === 'string-array' || f.kind === 'string')
  if (!arrayField) return `Whole numbers between ${l.min} and ${l.max}.`
  if (arrayField.kind === 'int-array') return `Up to ${l.maxN} numbers between ${l.min} and ${l.max}.`
  if (arrayField.kind === 'string') return `Up to ${l.maxN} characters.`
  return `Up to ${l.maxN} words.`
}

const sameValues = (a: Record<string, string>, b: Record<string, string>) =>
  Object.keys(b).every((k) => (a[k] ?? '').trim() === b[k].trim())

/** The "Your input" card: type something, pick a preset or roll a random one, and run it. */
export function PlaygroundInput({ tracer, presetIndex = 0, initialValues, onRun, className }: PlaygroundInputProps) {
  const { input } = tracer
  const uid = useId()
  const seed = useRef(1)
  const refs = useRef<Record<string, HTMLInputElement | null>>({})

  const initial = useMemo(() => {
    if (initialValues) return initialValues
    const p = input.presets[Math.min(Math.max(0, presetIndex), input.presets.length - 1)]
    return p ? input.format(p.value) : {}
  }, [input, presetIndex, initialValues])

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (raw: Record<string, string>) => {
    const parsed = input.parse(raw)
    if (!parsed.ok) {
      const field = parsed.field && input.fields.some((f) => f.name === parsed.field) ? parsed.field : input.fields[0]?.name
      setErrors({ [field ?? '_']: parsed.error })
      if (field) refs.current[field]?.focus()
      return
    }
    const problem = onRun(parsed.value, raw)
    setErrors(problem ? { _: problem } : {})
  }

  const fill = (next: Record<string, string>) => {
    setValues(next)
    submit(next)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(values)
  }

  const hint = limitsHint(input.fields, input.limits)

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby={`${uid}-h`}
      className={cn('flex flex-col gap-3 rounded-card border border-rule bg-paper-raised p-4 shadow-1', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={`${uid}-h`} className="font-serif text-[20px] font-semibold leading-7 text-ink">
          Your input
        </h3>
        <p className="text-[13px] leading-[18px] text-ink-3">{hint}</p>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        {input.fields.map((f) => {
          const id = `${uid}-${f.name}`
          const err = errors[f.name]
          const narrow = f.kind === 'int'
          return (
            <div key={f.name} className={cn('flex min-w-0 flex-col gap-1', narrow ? 'w-28' : 'min-w-[12rem] flex-1')}>
              <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
                {f.label}
              </label>
              <input
                id={id}
                ref={(el) => {
                  refs.current[f.name] = el
                }}
                type="text"
                // int-array needs commas and minus signs, which the numeric keypad lacks.
                inputMode={f.kind === 'int' ? 'numeric' : 'text'}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={values[f.name] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => {
                  const v = e.target.value
                  setValues((prev) => ({ ...prev, [f.name]: v }))
                  if (errors[f.name] || errors._) setErrors({})
                }}
                aria-invalid={err ? true : undefined}
                aria-describedby={err ? `${id}-err` : f.help ? `${id}-help` : undefined}
                className={cn(
                  'h-11 w-full rounded-cell border bg-paper-sunken px-3 font-mono text-[15px] text-ink placeholder:text-ink-3',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                  err ? 'border-role-error' : 'border-rule hover:border-rule-strong',
                )}
              />
              {err ? (
                <p id={`${id}-err`} className="text-[13px] leading-[18px] text-role-error">
                  <span aria-hidden="true">✕ </span>
                  {err}
                </p>
              ) : f.help ? (
                <p id={`${id}-help`} className={cn('text-[12px] leading-4 text-ink-3', narrow && 'sr-only')}>
                  {f.help}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      {errors._ ? (
        <p role="alert" className="text-[13px] leading-[18px] text-role-error">
          <span aria-hidden="true">✕ </span>
          {errors._}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Run it</Button>
        <Button
          variant="secondary"
          onClick={() => fill(input.format(input.random(seed.current++)))}
          leadingIcon={
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
              <circle cx="6" cy="6" r="0.6" fill="currentColor" />
              <circle cx="10" cy="10" r="0.6" fill="currentColor" />
            </svg>
          }
        >
          Random
        </Button>
        <span className="ml-1 hidden text-[13px] text-ink-3 sm:inline">or try</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Example inputs">
          {input.presets.map((p, i) => {
            const text = input.format(p.value)
            return (
              <Chip key={i} selectable selected={sameValues(values, text)} onClick={() => fill(text)} className="max-w-full">
                <span className="truncate">{p.label}</span>
              </Chip>
            )
          })}
        </div>
      </div>
    </form>
  )
}
