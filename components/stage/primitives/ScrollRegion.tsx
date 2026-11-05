'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import type { HTMLAttributes, MutableRefObject } from 'react'

import { cn, focusRing } from '@/components/ui/cn'

export interface ScrollRegionProps extends HTMLAttributes<HTMLDivElement> {
  /** Names the region for screen readers, e.g. "The rules, scrollable". */
  label: string
  /** Which way it scrolls. Defaults to horizontal. */
  axis?: 'x' | 'y' | 'both'
}

/**
 * A scroll container that keyboard users can reach. While its content overflows
 * it becomes a labelled, focusable region (arrow keys scroll it, with a visible
 * focus ring); when everything fits it is a plain div, so there is no dead tab stop.
 */
export const ScrollRegion = forwardRef<HTMLDivElement, ScrollRegionProps>(function ScrollRegion(
  { label, axis = 'x', className, children, ...rest },
  forwarded,
) {
  const inner = useRef<HTMLDivElement | null>(null)
  const [scrolls, setScrolls] = useState(false)

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      inner.current = el
      if (typeof forwarded === 'function') forwarded(el)
      else if (forwarded) (forwarded as MutableRefObject<HTMLDivElement | null>).current = el
    },
    [forwarded],
  )

  useEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => {
      const x = axis !== 'y' && el.scrollWidth > el.clientWidth + 1
      const y = axis !== 'x' && el.scrollHeight > el.clientHeight + 1
      setScrolls(x || y)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    Array.from(el.children).forEach((c) => ro.observe(c))
    return () => ro.disconnect()
  }, [axis, children])

  return (
    <div
      {...rest}
      ref={setRef}
      className={cn(axis === 'x' ? 'overflow-x-auto' : axis === 'y' ? 'overflow-y-auto' : 'overflow-auto', scrolls && focusRing, className)}
      {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}
    >
      {children}
    </div>
  )
})
