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

/** The lesson method as a numbered list, drawn like a margin-numbered notebook page. */
export function MethodSteps({ className }: { className?: string }) {
  return (
    <ol className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-5', className)}>
      {STEPS.map((step, i) => (
        <li key={step.name} className="rounded-card border border-rule bg-paper-raised p-4 shadow-1">
          <p className="font-hand text-[22px] leading-none text-coral-ink" aria-hidden="true">
            {i + 1}
          </p>
          <h3 className="t-h3 mt-2 text-ink">
            <span className="sr-only">{i + 1}. </span>
            {step.name}
          </h3>
          <p className="mt-2 text-[15px] leading-6 text-ink-2">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
