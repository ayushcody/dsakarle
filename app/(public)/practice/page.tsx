import type { Metadata } from 'next'
import Link from 'next/link'

import { Callout } from '@/components/ui'
import { PracticeBrowser } from '@/components/practice/PracticeBrowser'

import { buildPracticeList } from './problems'

export const metadata: Metadata = {
  title: 'Practice — DSA Karle',
  description:
    'Every practice problem from the lessons in one list: filter by pattern and difficulty, open it on LeetCode, and tick off what you have solved. Progress stays in your browser.',
  alternates: { canonical: '/practice' },
}

export default function PracticePage() {
  const { items, lessons } = buildPracticeList()

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8 max-w-[62ch]">
        <p className="t-eyebrow mb-3">Practice</p>
        <h1 className="t-h1 text-ink">Now try it on real problems.</h1>
        <p className="t-body mt-4 text-ink-2">
          Every problem below comes from a lesson, so each one is tagged with the pattern it practises.
          That tag is the clue: if you know the pattern, the problem gets a lot smaller.
        </p>
        <p className="t-small mt-3 text-ink-3">
          {items.length} problems from {lessons.length} lessons. The list grows as lessons are upgraded.
          Problems open on LeetCode; DSA Karle does not run or judge your code.
        </p>
      </header>

      <Callout variant="tip" title="Stuck?" className="mb-8">
        Open the pattern&rsquo;s lesson, find the walkthrough, and try your own input first. Watching the
        idea run on a small array usually shows what the problem is really asking.{' '}
        <Link href="/learn" className="font-semibold text-coral-ink underline underline-offset-4">
          Browse lessons
        </Link>
        .
      </Callout>

      <PracticeBrowser items={items} lessons={lessons} />

      <p className="t-small mt-10 text-ink-3">
        &ldquo;I solved this&rdquo; is saved only in this browser, so it will not follow you to another device.
      </p>
    </div>
  )
}
