'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';

import courseStructure from '@/content/course-structure.json';
import { getProgress, markComplete } from '@/lib/progress';

const EASE = [0.4, 0, 0.2, 1] as const;

export function MarkCompleteButton({ topicId }: { topicId: string }) {
  const [isComplete, setIsComplete] = useState(false);
  const [toast, setToast] = useState(false);
  const [masteredGroup, setMasteredGroup] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsComplete(getProgress().completedSections.includes(topicId));
  }, [topicId]);

  const complete = () => {
    markComplete(topicId);
    setIsComplete(true);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.7 }, colors: ['#CC5A37', '#D99B26', '#1E7B6C'], ticks: 300 });
    }
    setToast(true);
    setTimeout(() => setToast(false), 3000);

    const done = getProgress().completedSections;
    const group = courseStructure.groups.find((g) => g.topics.some((t) => t.slug === topicId));
    if (group && group.topics.every((t) => done.includes(t.slug))) setMasteredGroup(group.title);
  };

  const share = async () => {
    await navigator.clipboard.writeText(`I just mastered every ${masteredGroup} topic on DSA Karle 🚀 #DSA #100DaysOfCode`);
    setCopied(true);
  };

  return (
    <div className="flex justify-center">
      <button className="button-primary inline-flex items-center px-6 py-3" onClick={complete} disabled={isComplete}>
        {isComplete ? 'Marked Complete ✓' : 'Mark Complete ✓'}
      </button>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed top-20 right-6 z-[60] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--white)] px-5 py-4 shadow-[var(--shadow-card)] font-dmsans font-bold text-[var(--text-primary)]"
          >
            🎉 Topic complete! Keep going
          </motion.div>
        )}

        {masteredGroup && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMasteredGroup(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-[24px] border border-[var(--border)] bg-[var(--white)] p-8 text-center shadow-[var(--shadow-card)]"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="font-dmsans text-2xl font-bold text-[var(--text-primary)]">{masteredGroup} Master!</h3>
              <p className="font-dmsans text-[var(--text-secondary)] mt-2 mb-6">Every topic in this group is done. Brag a little.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={share} className="button-primary px-5 py-2.5">{copied ? 'Copied ✓' : 'Copy share text'}</button>
                <button onClick={() => setMasteredGroup(null)} className="px-5 py-2.5 rounded-full border border-[var(--border)] font-dmsans font-bold text-[var(--text-secondary)]">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
