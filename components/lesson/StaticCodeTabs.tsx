'use client'

import { useState } from 'react'

import type { RenderedCodeProp } from '@/components/stage/contracts'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/components/ui/cn'
import type { Lang } from '@/lib/engine/types'

const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

/** Python / Java / C++ tabs over server-highlighted code. No replay, no highlighting sync: just the code. */
export function StaticCodeTabs({
  code,
  label,
  className,
}: {
  code: RenderedCodeProp
  /** Accessible name, e.g. the example title. */
  label: string
  className?: string
}) {
  const [lang, setLang] = useState<Lang>('python')
  const rendered = code.langs[lang]

  return (
    <div className={className}>
      <SegmentedControl options={LANG_OPTIONS} value={lang} onChange={setLang} aria-label={`${label}: language`} />
      <div
        // Server-rendered Shiki output from our own content/code files.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: rendered.html }}
        role="region"
        aria-label={`${label} in ${LANG_OPTIONS.find((o) => o.value === lang)?.label}`}
        tabIndex={0}
        className={cn(
          'mt-3 max-w-full overflow-x-auto rounded-card border border-rule bg-paper-sunken px-4 py-3',
          'font-mono text-[13px] leading-6 [&_pre]:m-0 [&_pre]:w-max [&_pre]:min-w-full [&_pre]:bg-transparent [&_pre]:font-[inherit]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        )}
      />
    </div>
  )
}
