import { Prose } from '@/components/ui/Prose'

import { SectionFrame } from './SectionFrame'

/** "This lesson will show you how to:" plus the verb-led outcomes. */
export function OverviewSection({ items }: { items: string[] }) {
  return (
    <SectionFrame id="overview">
      <Prose>
        <p>This lesson will show you how to:</p>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Prose>
    </SectionFrame>
  )
}
