import type { Metadata } from 'next'

import { GymApp } from '@/components/gym/GymApp'
import { loadGymItems } from '@/lib/gym-server'

export const metadata: Metadata = {
  title: 'Pattern gym — DSA Karle',
  description:
    'Read a problem, name the pattern. Quick mixed drills across every lesson to train the reflex you need in interviews.',
  alternates: { canonical: '/gym' },
}

export default function GymPage() {
  const items = loadGymItems()
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header>
        <p className="t-eyebrow mb-3">Practice</p>
        <h1 className="t-h1 text-ink">Pattern gym</h1>
        <p className="mt-3 text-[16px] leading-7 text-ink-2">
          Read a problem. Name the pattern. Ten quick reps train the reflex you need in interviews.
        </p>
      </header>
      <GymApp items={items} />
    </div>
  )
}
