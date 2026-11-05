import type { Metadata } from 'next'
import Link from 'next/link'

import { PracticeBrowser } from '@/components/practice/PracticeBrowser'

import { buildPracticeList } from './problems'

export const metadata: Metadata = {
  title: 'Practice — DSA Karle',
  description:
    'Every practice problem from the lessons in one list: filter by pattern and difficulty, open it on LeetCode, and mark what you have solved. Progress stays in your browser.',
  alternates: { canonical: '/practice' },
}

export default function PracticePage() {
  const { items, lessons } = buildPracticeList()

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8 max-w-[68ch]">
        <h1 className="t-h1 text-ink">Practice</h1>
        <p className="t-body mt-3 text-ink-2">
          {items.length} problems from {lessons.length} lessons. Each one is tagged with the pattern it practises,
          and that tag is the clue: if you know the pattern, the problem gets a lot smaller.
        </p>
        <p className="t-small mt-3 text-ink-3">
          Problems open on LeetCode; DSA Karle does not run or judge your code. Stuck? Open the pattern&rsquo;s
          lesson and try your own input first, or{' '}
          <Link href="/paths" className="font-semibold text-coral-ink underline underline-offset-4">
            browse the paths
          </Link>
          .
        </p>
      </header>

      <PracticeBrowser items={items} lessons={lessons} />

      <p className="t-small mt-10 text-ink-3">
        &ldquo;Solved&rdquo; is saved only in this browser, so it will not follow you to another device.
      </p>
    </div>
  )
}
