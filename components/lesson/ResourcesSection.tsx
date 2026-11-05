import { focusRing } from '@/components/ui/cn'
import type { LessonResource } from '@/types/learning'

import { SectionFrame } from './SectionFrame'

/** Reputable places to go deeper, each opening in a new tab. */
export function ResourcesSection({ resources }: { resources: LessonResource[] }) {
  return (
    <SectionFrame id="resources">
      <ul className="m-0 list-disc space-y-3 pl-6 text-[16px] leading-7 text-ink-2">
        {resources.map((resource) => (
          <li key={resource.url}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-cell font-medium text-coral-ink underline underline-offset-4 ${focusRing}`}
            >
              {resource.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {resource.note ? <span> — {resource.note}</span> : null}
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
