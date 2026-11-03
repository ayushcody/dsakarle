'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

import { Button, cn } from '@/components/ui'
import { fade } from '@/lib/motion'

import { useStage } from './StageProvider'

export interface FinishNudgeProps {
  /** The "Your input" mode exists for this lesson. */
  canTryOwn: boolean
  onTryOwn: () => void
  /** Called once when the guided run reaches its last frame. */
  onFinish?: () => void
  /** Only report the finish; draw nothing (hero). */
  quiet?: boolean
  className?: string
}

/** A small "you made it" line at the end of the guided run, pointing at the playground. */
export function FinishNudge({ canTryOwn, onTryOwn, onFinish, quiet = false, className }: FinishNudgeProps) {
  const finished = useStage((s) => s.finished)
  const mode = useStage((s) => s.mode)
  const answered = useStage((s) => s.answered)
  const atEnd = useStage((s) => s.frames.length > 0 && s.index >= s.frames.length - 1)
  const done = finished && mode === 'guided'

  const reported = useRef(false)
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onFinish?.()
    }
  }, [done, onFinish])

  if (!done || !atEnd || quiet) return null

  const vals = Object.values(answered)
  const right = vals.filter((v) => v === 'correct').length
  const total = right + vals.filter((v) => v === 'revealed').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      role="status"
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-rule border-l-[3px] border-l-role-found bg-[var(--role-found-wash)] px-4 py-3', className)}
    >
      <span aria-hidden="true" className="text-[18px] font-bold leading-none text-role-found">
        ✓
      </span>
      <p className="min-w-0 flex-1 basis-56 text-[16px] leading-6 text-ink">
        <span className="font-semibold">That is the whole run.</span>{' '}
        {total > 0 ? `You called ${right} of ${total} correctly. ` : ''}
        {canTryOwn ? 'Now see it work on an input you choose.' : 'Press Replay to watch it again.'}
      </p>
      {canTryOwn ? (
        <Button onClick={onTryOwn} trailingIcon={<span>→</span>}>
          Now try your own
        </Button>
      ) : null}
    </motion.div>
  )
}
