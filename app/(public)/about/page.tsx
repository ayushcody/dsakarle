import type { Metadata } from 'next'

import { ColourLegend } from '@/components/about/ColourLegend'
import { MethodSteps } from '@/components/about/MethodSteps'
import { NameStory } from '@/components/about/NameStory'
import { Button, Disclosure, cn, focusRing } from '@/components/ui'

export const metadata: Metadata = {
  title: 'About — DSA Karle',
  description:
    'What DSA Karle is, how a lesson works, what the colours mean and what it is not. No accounts; your progress stays in your browser.',
  alternates: { canonical: '/about' },
}

const REPO = 'https://github.com/ayushcody/dsakarle'
const ISSUES = 'https://github.com/ayushcody/dsakarle/issues/new'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-14">
      <h2 id={`${id}-title`} className="t-h2 text-ink">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

const p = 'text-[16px] leading-7 text-ink-2'
const link = cn('rounded-cell text-coral-ink underline underline-offset-4 hover:decoration-2', focusRing)

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[68ch] px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      <header>
        <h1 className="t-h1 text-ink">Watch the algorithm run, then write it.</h1>
        <p className="t-body mt-5 text-ink-2">
          DSA Karle teaches data structures and algorithms by letting you see them move. Each lesson draws the data
          like a page in a notebook, lets you step through a real run, and only then shows the code. The goal is
          simple: when you meet a new problem, you recognise the shape of it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/paths" size="lg">
            Explore paths
          </Button>
          <Button href="/practice" variant="secondary" size="lg">
            Practice problems
          </Button>
        </div>
      </header>

      <Section id="method" title="How a lesson works">
        <p className={p}>
          Every lesson follows the same beats, so you always know where you are. The order matters: the idea comes
          first, and the syntax comes last.
        </p>
        <MethodSteps />
      </Section>

      <Section id="colour" title="The colour language">
        <p className={p}>
          In every lesson the same colours mean the same roles, so once you learn them in one lesson you can read
          all of them. Each colour also comes with a mark or a line style, so you never have to tell them apart by
          colour alone.
        </p>
        <ColourLegend />
      </Section>

      <section className="mt-14">
        <NameStory />
      </section>

      <Section id="not" title="What it is not">
        <p className={p}>
          <strong className="font-semibold text-ink">Not a judge.</strong> DSA Karle does not run or grade your
          code. Practice problems open on LeetCode, where you write and submit them.
        </p>
        <p className={p}>
          <strong className="font-semibold text-ink">No accounts.</strong> There is no sign-up and no login. The
          things you mark as solved and the lessons you finish stay in your browser, on this device, and nowhere
          else.
        </p>
      </Section>

      <Section id="faq" title="Questions">
        <div className="space-y-3">
          <Disclosure title="Which languages do the lessons use?">
            Python, Java and C++. In a lesson you can switch between them, and the highlighted line follows the
            step you are watching.
          </Disclosure>
          <Disclosure title="Where is my progress stored?">
            In your browser&rsquo;s local storage, on this device only. Clearing site data removes it, and it will
            not appear on another browser or computer.
          </Disclosure>
          <Disclosure title="Do I need an account?">No. There is nothing to sign up for.</Disclosure>
        </div>
      </Section>

      <section aria-labelledby="made-title" className="mt-14 border-t border-rule pt-8">
        <h2 id="made-title" className="t-eyebrow mb-3">
          Made by
        </h2>
        <p className={p}>Made by Ayush Chougula, one lesson at a time.</p>
        <p className={cn(p, 'mt-3')}>
          The code is open on{' '}
          <a href={REPO} target="_blank" rel="noopener noreferrer" className={link}>
            GitHub
          </a>
          . Found a mistake or have an idea?{' '}
          <a href={ISSUES} target="_blank" rel="noopener noreferrer" className={link}>
            Report an issue
          </a>
          .
        </p>
      </section>
    </div>
  )
}
