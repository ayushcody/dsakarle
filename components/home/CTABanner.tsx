import React from 'react';
import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="bg-[var(--accent-coral)] py-20 px-6 w-full mt-auto">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <h2 className="font-dmsans text-4xl md:text-5xl font-bold text-[var(--white)] mb-6 tracking-tight">Ready to master algorithms?</h2>
        <p className="font-dmsans text-[var(--white)]/90 text-lg mb-10">Start your journey today. It&apos;s free.</p>
        <Link href="/learn" className="inline-flex items-center justify-center bg-[var(--white)] text-[var(--accent-coral)] font-dmsans font-bold text-lg px-8 py-4 rounded-full hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
          Start Learning &rarr;
        </Link>
      </div>
    </section>
  );
}
