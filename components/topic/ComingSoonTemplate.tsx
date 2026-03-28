import Link from 'next/link';

import { getBadgeForSlug } from '@/components/badges/registry';

export function ComingSoonTemplate({ slug }: { slug: string }) {
  const Badge = getBadgeForSlug(slug);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
      <Badge className="h-28 w-28" />
      <span className="badge-pill badge-pill-amber mt-8">Coming Soon</span>
      <h1 className="mt-6 font-lora text-5xl font-bold text-[var(--text-primary)]">
        {slug.replace(/-/g, ' ')}
      </h1>
      <p className="mt-4 max-w-2xl font-dmsans text-lg leading-relaxed text-[var(--text-secondary)]">
        This topic route is already live so your curriculum map stays stable. The full visual lesson, quizzes, and stepper will be published in the next content pass.
      </p>
      <Link href="/learn" className="button-primary mt-10 inline-flex items-center px-6 py-3">
        Back to Curriculum
      </Link>
    </div>
  );
}
