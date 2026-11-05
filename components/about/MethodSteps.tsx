import { cn } from '@/components/ui'

const STEPS = [
  {
    name: 'Picture',
    body: 'Start with one still drawing of the data, with a few handwritten notes. Before anything moves, you see the shape of the thing.',
  },
  {
    name: 'Watch',
    body: 'Step through a run, one move at a time. Play it, pause it, scrub back. Nothing is hidden behind a fast animation.',
  },
  {
    name: 'Predict',
    body: 'Before a step plays, you guess what happens next. Being wrong here is cheap, and it is where the idea sticks.',
  },
  {
    name: 'Try',
    body: 'Type in your own input and watch the same algorithm handle it. If you can break it, you are starting to understand it.',
  },
  {
    name: 'Code',
    body: 'Only now the code, in Python, Java or C++, lit up line by line in sync with what you just watched.',
  },
] as const

/** The lesson method as a calm numbered list. */
export function MethodSteps({ className }: { className?: string }) {
  return (
    <ol className={cn('divide-y divide-rule rounded-card border border-rule bg-paper-raised', className)}>
      {STEPS.map((step, i) => (
        <li key={step.name} className="flex gap-4 p-4 sm:p-5">
          <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-paper-sunken font-mono text-[13px] font-medium text-ink-2">
            {i + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold leading-6 text-ink">
              <span className="sr-only">{i + 1}. </span>
              {step.name}
            </h3>
            <p className="mt-1 text-[15px] leading-6 text-ink-2">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
