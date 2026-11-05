'use client'

import { Disclosure } from '@/components/ui/Disclosure'
import { cn, focusRing } from '@/components/ui/cn'

import { useLessonReading } from './LessonShell'

export interface OutlineItem {
  id: string
  label: string
}

/**
 * "Lesson contents": anchors for the sections actually on the page.
 * `rail` is the sticky right column (xl+); `inline` is a compact Disclosure at the top of the article below xl.
 */
export function LessonContents({ variant }: { variant: 'rail' | 'inline' }) {
  const { outline, activeId, read } = useLessonReading()
  if (outline.length === 0) return null

  const list = (
    <ol className="m-0 list-none space-y-0.5 p-0">
      {outline.map((item) => {
        const active = item.id === activeId
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'block min-h-[32px] border-l-2 py-1 pl-3 text-[14px] leading-5 transition-colors',
                focusRing,
                active
                  ? 'border-coral-ink font-semibold text-ink'
                  : 'border-transparent text-ink-3 hover:border-rule-strong hover:text-ink',
              )}
            >
              {item.label}
            </a>
          </li>
        )
      })}
    </ol>
  )

  if (variant === 'inline') {
    return (
      <div className="mx-auto max-w-[720px] xl:hidden">
        <Disclosure title="On this page">
          <nav aria-label="On this page">{list}</nav>
        </Disclosure>
      </div>
    )
  }

  const readCount = outline.filter((item) => read.has(item.id)).length
  return (
    <aside aria-label="Lesson contents" className="hidden w-[200px] shrink-0 xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">
        <h2 className="t-eyebrow mb-3 pl-3">Lesson contents</h2>
        <nav aria-label="Lesson contents">{list}</nav>
        <p role="status" className="mt-4 pl-3 text-[12px] text-ink-3">
          {readCount} of {outline.length} sections read
        </p>
      </div>
    </aside>
  )
}
