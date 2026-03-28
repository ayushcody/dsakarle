'use client';

import { useEffect, useState } from 'react';

import { getProgress, markComplete } from '@/lib/progress';

export function MarkCompleteButton({ topicId }: { topicId: string }) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setIsComplete(getProgress().completedSections.includes(topicId));
  }, [topicId]);

  return (
    <div className="flex justify-center">
      <button
        className="button-primary inline-flex items-center px-6 py-3"
        onClick={() => {
          markComplete(topicId);
          setIsComplete(true);
        }}
        disabled={isComplete}
      >
        {isComplete ? 'Marked Complete ✓' : 'Mark Complete ✓'}
      </button>
    </div>
  );
}
