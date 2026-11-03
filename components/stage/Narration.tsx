'use client'

import { motion } from 'framer-motion'
import type { RefObject } from 'react'

import { cn } from '@/components/ui'
import { fade } from '@/lib/motion'

import { PredictPrompt } from './PredictPrompt'
import { useStage } from './StageProvider'

export interface NarrationProps {
  /** The stage container, forwarded to the predict prompt for its key handling. */
  scopeRef: RefObject<HTMLElement>
  /** Hero: slightly smaller type. */
  compact?: boolean
  className?: string
}

/** The sentence for this moment. While a predict question is open it shows the question card instead. */
export function Narration({ scopeRef, compact = false, className }: NarrationProps) {
  const index = useStage((s) => s.index)
  const say = useStage((s) => s.frames[s.index]?.say ?? '')
  const promptFrame = useStage((s) => (s.prompt ? s.prompt.frameIndex : -1))
  const showPrompt = promptFrame >= 0

  return (
    <div className={cn(compact ? 'min-h-[4.5rem]' : 'min-h-[6.5rem]', className)}>
      <div aria-live="polite" aria-atomic="true">
        {showPrompt ? null : (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fade}
            className={cn(
              'font-serif text-ink',
              compact ? 'text-[19px] leading-[1.45] sm:text-[21px]' : 'text-[21px] leading-[1.45] sm:text-[25px] sm:leading-[1.4]',
            )}
          >
            {say || ' '}
          </motion.p>
        )}
      </div>
      {showPrompt ? <PredictPrompt key={promptFrame} scopeRef={scopeRef} /> : null}
    </div>
  )
}
