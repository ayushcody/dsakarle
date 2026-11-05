import type { RenderedCodeProp } from '@/components/stage/contracts'
import { Chip } from '@/components/ui/Chip'
import { Disclosure } from '@/components/ui/Disclosure'
import { focusRing } from '@/components/ui/cn'
import type { TracerId } from '@/lib/engine/types'
import type { WorkedExampleV2 } from '@/types/learning'

import { SectionFrame } from './SectionFrame'
import { StaticCodeTabs } from './StaticCodeTabs'
import { PROBLEM_DIFFICULTY } from './utils'

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5" />
    </svg>
  )
}

function IoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="t-eyebrow mb-1">{label}</p>
      <pre
        role="region"
        aria-label={label}
        tabIndex={0}
        className={`m-0 overflow-x-auto rounded-cell border border-rule bg-paper-sunken px-3 py-2 font-mono text-[13px] leading-6 text-ink ${focusRing}`}
      >
        {value}
      </pre>
    </div>
  )
}

/** Worked examples as folded cards: problem, input/output, approach, code, cost. */
export function ExamplesSection({
  examples,
  code,
}: {
  examples: WorkedExampleV2[]
  code: Partial<Record<TracerId, RenderedCodeProp>>
}) {
  return (
    <SectionFrame id="examples" intro="Real interview problems, solved with the same recipe.">
      <div className="space-y-3">
        {examples.map((example, index) => {
          const difficulty = PROBLEM_DIFFICULTY[example.difficulty]
          const rendered = code[example.code as TracerId]
          return (
            <Disclosure
              key={example.url}
              defaultOpen={index === 0}
              title={
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[16px] font-semibold">{example.title}</span>
                  <Chip variant={difficulty.variant}>{difficulty.label}</Chip>
                </span>
              }
            >
              <div className="space-y-5 py-1">
                <a
                  href={example.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-cell text-[14px] font-semibold text-coral-ink underline underline-offset-4 ${focusRing}`}
                >
                  Open on LeetCode
                  <ExternalIcon />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>

                <p className="text-[16px] leading-7 text-ink">{example.problem}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <IoBlock label="Input" value={example.input} />
                  <IoBlock label="Output" value={example.output} />
                </div>

                <div>
                  <p className="t-eyebrow mb-2">Approach</p>
                  <ol className="space-y-2">
                    {example.approach.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex gap-3 text-[16px] leading-6 text-ink">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-wash font-sans text-[12px] font-semibold text-coral-ink"
                        >
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {rendered ? (
                  <StaticCodeTabs code={rendered} label={example.title} />
                ) : (
                  <p className="text-[14px] text-ink-3">Code for this example is not available right now.</p>
                )}

                <div className="flex flex-wrap gap-2" role="group" aria-label="Cost">
                  <Chip variant="coral">Time · {example.time}</Chip>
                  <Chip variant="teal">Space · {example.space}</Chip>
                </div>
              </div>
            </Disclosure>
          )
        })}
      </div>
    </SectionFrame>
  )
}
