import type { Metadata } from 'next';

import { Dashboard } from '@/components/dashboard/Dashboard';

export const metadata: Metadata = {
  title: 'Your progress | DSA Karle',
  description: 'Where you left off, how far along each path you are, and your practice and gym results. Saved in this browser.',
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      <header>
        <h1 className="t-h1 text-ink">Your progress</h1>
        <p className="t-body mt-3 text-ink-2">Progress is saved in this browser.</p>
      </header>
      <Dashboard />
    </div>
  );
}
