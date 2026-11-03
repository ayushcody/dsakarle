import type { Metadata } from 'next';

import { CourseToc } from '@/components/learn/CourseToc';
import { ProgressLine } from '@/components/learn/ProgressLine';
import { StartPaths } from '@/components/learn/StartPaths';
import { SearchButton } from '@/components/learn/SearchButton';

export const metadata: Metadata = {
  title: 'Course | DSA Karle',
  description:
    'Every DSA Karle lesson in learning order: data structures first, then the patterns built on them. Live lessons have step-through walkthroughs; drafts are reading notes.',
};

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      <header className="mb-10 md:mb-12">
        <p className="t-eyebrow">Course</p>
        <h1 className="t-h1 mt-2 text-ink">Everything, in order</h1>
        <p className="t-body mt-3 max-w-[60ch] text-ink-2">
          Start at the top, or jump to the pattern you need. Live lessons have walkthroughs you can play; drafts are
          reading notes for now.
        </p>
        <div className="mt-6 flex flex-col gap-5">
          <SearchButton />
          <ProgressLine />
        </div>
      </header>

      <div className="mb-14 md:mb-16">
        <StartPaths />
      </div>

      <CourseToc />
    </div>
  );
}
