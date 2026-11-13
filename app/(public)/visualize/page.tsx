import type { Metadata } from 'next'
import Link from 'next/link'

import { VisualGallery } from '@/components/visualize/VisualGallery'
import type { GalleryGroup } from '@/components/visualize/VisualGallery'
import { visualEntries, visualGroups } from '@/lib/visualize'

export const metadata: Metadata = {
  title: 'Visualize — DSA Karle',
  description:
    'Every algorithm on DSA Karle as an interactive visualization: step through a real run, guess the next move, and try your own input. Code in Python, Java and C++.',
  alternates: { canonical: '/visualize' },
}

export default function VisualizePage() {
  const total = visualEntries().length
  const groups: GalleryGroup[] = visualGroups().map((g) => ({
    pathId: g.pathId,
    pathTitle: g.pathTitle,
    lessons: g.lessons.map((l) => ({
      slug: l.slug,
      title: l.title,
      glyph: l.glyph,
      entries: l.entries.map((e) => ({ href: `/visualize/${e.topic}/${e.algo}`, label: e.label, lessonTitle: e.lessonTitle })),
    })),
  }))
  const lessonCount = groups.reduce((n, g) => n + g.lessons.length, 0)

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8 max-w-[68ch]">
        <h1 className="t-h1 text-ink">Visualize</h1>
        <p className="t-body mt-3 text-ink-2">
          {total} algorithms from {lessonCount} lessons, each one running for real. Step through it, guess the next move,
          then type your own input and watch the same algorithm handle it.
        </p>
        <p className="t-small mt-3 text-ink-3">
          New to an idea? Each lesson explains the picture and the rules before you watch, so start with the{' '}
          <Link href="/paths" className="font-semibold text-coral-ink underline underline-offset-4">
            paths
          </Link>{' '}
          if something looks unfamiliar.
        </p>
      </header>

      <VisualGallery groups={groups} />
    </div>
  )
}
