import type { Metadata } from 'next'
import Link from 'next/link'

import { ColourLegend } from '@/components/about/ColourLegend'
import { MethodSteps } from '@/components/about/MethodSteps'
import { Glyph } from '@/components/glyph'
import { Button, Callout, Chip, Disclosure } from '@/components/ui'
import { LESSONS, liveLessons } from '@/lib/curriculum'

export const metadata: Metadata = {
  title: 'About — DSA Karle',
  description:
    'What DSA Karle is, how a lesson works, what the colours mean, and which lessons are ready today. No accounts; your progress stays in your browser.',
  alternates: { canonical: '/about' },
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-16 sm:mt-20">
      <p className="t-eyebrow mb-3">{eyebrow}</p>
      <h2 id={`${id}-title`} className="t-h2 text-ink">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function AboutPage() {
  const live = liveLessons()
  const total = LESSONS.length
  const draftCount = total - live.length

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      {/* What it is */}
      <header className="max-w-[62ch]">
        <p className="t-eyebrow mb-3">About</p>
        <h1 className="t-h1 text-ink">Watch the algorithm run, then write it.</h1>
        <p className="t-body mt-5 text-ink-2">
          DSA Karle teaches data structures and algorithms by letting you see them move. Each lesson draws
          the data like a page in a notebook, lets you step through a real run, and only then shows the code.
          The goal is simple: when you meet a new problem, you recognise the shape of it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/learn" size="lg">
            Start learning
          </Button>
          <Button href="/practice" variant="secondary" size="lg">
            See practice problems
          </Button>
        </div>
      </header>

      {/* The method */}
      <Section id="method" eyebrow="How a lesson works" title="Picture, watch, predict, try, code.">
        <p className="mb-6 max-w-[62ch] text-[17px] leading-7 text-ink-2">
          Every upgraded lesson follows the same five beats, so you always know where you are. The order
          matters: the idea comes first, and the syntax comes last.
        </p>
        <MethodSteps />
      </Section>

      {/* Colour language */}
      <Section id="colour" eyebrow="The colour language" title="Every colour means one thing.">
        <p className="mb-6 max-w-[62ch] text-[17px] leading-7 text-ink-2">
          In every lesson the same colours mean the same roles, so once you learn them in one lesson you can
          read all of them. Each colour also comes with a mark or a line style, so you never have to tell
          them apart by colour alone.
        </p>
        <ColourLegend />
      </Section>

      {/* Status */}
      <Section id="status" eyebrow="Where things stand" title="Live and Draft, honestly.">
        <p className="max-w-[62ch] text-[17px] leading-7 text-ink-2">
          <strong className="font-semibold text-ink">{live.length} of {total} lessons are Live</strong>
          {' '}today. Live means the lesson has the full five-beat treatment and passes the checks we run on
          it. The other {draftCount} are Draft: earlier versions or outlines that are being upgraded one by
          one. You can read them, but expect them to change.
        </p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {live.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/learn/${lesson.slug}`}
                className="inline-flex min-h-[44px] items-center gap-3 rounded-card border border-rule bg-paper-raised px-4 py-2 shadow-1 transition-colors hover:border-rule-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <Glyph id={lesson.glyph} size={24} decorative className="text-coral-ink" />
                <span className="font-semibold text-ink">{lesson.title}</span>
                <Chip variant="found">Live</Chip>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] leading-6 text-ink-3">
          The full list, in learning order, is on the <Link href="/learn" className="text-coral-ink underline underline-offset-4">Learn page</Link>.
        </p>
      </Section>

      {/* What it is not */}
      <Section id="not" eyebrow="What it is not" title="No judge, no accounts.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout variant="note" title="Not a judge">
            DSA Karle does not run or grade your code. Practice problems open on LeetCode, where you write
            and submit them.
          </Callout>
          <Callout variant="note" title="No accounts">
            There is no sign-up and no login. The things you mark as solved stay in your browser, on this
            device, and nowhere else.
          </Callout>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Questions" title="Quick answers.">
        <div className="max-w-[720px] space-y-3">
          <Disclosure title="Which languages do the lessons use?">
            Python, Java and C++. In an upgraded lesson you can switch between them, and the highlighted
            line follows the step you are watching.
          </Disclosure>
          <Disclosure title="Where is my progress stored?">
            In your browser&rsquo;s local storage, on this device only. Clearing site data removes it, and it
            will not appear on another browser or computer.
          </Disclosure>
          <Disclosure title="Do I need an account?">
            No. There is nothing to sign up for.
          </Disclosure>
        </div>
      </Section>

      {/* Made by */}
      <section aria-labelledby="made-title" className="mt-16 border-t border-rule pt-8 sm:mt-20">
        <h2 id="made-title" className="t-eyebrow mb-3">
          Made by
        </h2>
        <p className="max-w-[62ch] text-[17px] leading-7 text-ink-2">
          Made by Ayush Chougula, one lesson at a time.
        </p>
      </section>
    </div>
  )
}
