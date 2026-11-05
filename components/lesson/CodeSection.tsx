'use client'

import dynamic from 'next/dynamic'

import { CodePanel } from '@/components/stage/CodePanel'
import { ScrollRegion } from '@/components/stage/primitives/ScrollRegion'
import type { RenderedCodeProp } from '@/components/stage/contracts'
import { Chip } from '@/components/ui/Chip'
import { Disclosure } from '@/components/ui/Disclosure'
import { Prose } from '@/components/ui/Prose'
import type { TracerId } from '@/lib/engine/types'
import type { LessonV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'
import { toComplexityKey } from './utils'

const ComplexityGauge = dynamic(
  () => import('@/components/visualizers/ComplexityGauge').then((m) => m.ComplexityGauge),
  {
    ssr: false,
    loading: () => <p className="t-small px-1 py-3 text-ink-3">Loading the chart…</p>,
  },
)

interface CodeSectionProps {
  template: LessonV2['template']
  title: string
  code: Partial<Record<TracerId, RenderedCodeProp>>
  /** Anchor ids in Rule Rail order (the tracer's `anchors`), when known. */
  anchorOrder: string[]
}

/** Pseudocode with faint rule numbers, then the real code, then what it costs. Code is shown last on purpose. */
export function CodeSection({ template, title, code, anchorOrder }: CodeSectionProps) {
  const { pseudocode, tracer, time, space, notes } = template
  const rendered = code[tracer]

  // Rule numbers follow the Rule Rail. If the tracer's order is unknown, fall back to first appearance.
  const order = [...anchorOrder]
  for (const line of pseudocode) {
    if (line.anchor && !order.includes(line.anchor)) order.push(line.anchor)
  }
  const ruleNumber = (anchor?: string) => (anchor ? order.indexOf(anchor) + 1 : 0)

  const gaugeKey = toComplexityKey(time)

  return (
    <SectionFrame id="code" intro="First the idea in plain steps. Then the same idea as real code, line for line.">
      <figure className="m-0">
        <figcaption className="t-eyebrow mb-2">Pseudocode</figcaption>
        <ScrollRegion label="Pseudocode, scrolls sideways" className="rounded-card border border-rule bg-paper-sunken py-3 font-mono text-[14px] leading-7 text-ink">
        <ol aria-label="Pseudocode" className="m-0 list-none p-0">
          {pseudocode.map((line, index) => {
            const n = ruleNumber(line.anchor)
            return (
              <li key={index} className="flex min-w-max items-baseline gap-3 px-4">
                <span
                  aria-hidden={n === 0}
                  className="w-5 shrink-0 select-none text-right text-[12px] text-ink-3"
                  title={n > 0 ? `Rule ${n}` : undefined}
                >
                  {n > 0 ? n : ''}
                </span>
                <span className="whitespace-pre" style={{ paddingLeft: `${(line.indent ?? 0) * 2}ch` }}>
                  {line.text}
                </span>
              </li>
            )
          })}
        </ol>
        </ScrollRegion>
        <p className="t-caption mt-2 text-ink-3">
          The faint numbers are the rules in the Rule Rail under the stage. Same numbers, same order.
        </p>
      </figure>

      {rendered ? (
        <div className="mt-8">
          <CodePanel tracer={tracer} code={rendered} />
        </div>
      ) : (
        <p className="mt-8 rounded-card border border-rule bg-paper-sunken p-4 text-[15px] text-ink-2">
          The code for this lesson is not available right now. The pseudocode above is the full idea.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Cost">
        <Chip variant="coral" className="max-w-full !whitespace-normal py-1.5 !leading-snug">
          Time · {time}
        </Chip>
        <Chip variant="teal" className="max-w-full !whitespace-normal py-1.5 !leading-snug">
          Space · {space}
        </Chip>
      </div>

      {notes && notes.length > 0 ? (
        <Prose className="mt-4">
          <ul>
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </Prose>
      ) : null}

      {gaugeKey ? (
        <div className="mt-6">
          <Disclosure title={`See how ${gaugeKey} grows`}>
            <div className="[&>section]:!mt-0 [&>section]:!border-0 [&>section]:!p-0 [&>section]:!shadow-none">
              <ComplexityGauge highlight={[gaugeKey]} title={`How ${title} scales`} />
            </div>
          </Disclosure>
        </div>
      ) : null}
    </SectionFrame>
  )
}
