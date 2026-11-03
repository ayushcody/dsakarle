import React from 'react';
import Link from 'next/link';

import { getCatalogTopics, type CatalogTopic } from '@/lib/content';
import { getBadgeForSlug } from '@/components/badges/registry';

import BadgeCard from './BadgeCard';

const dataStructures = getCatalogTopics('data-structure');
const algorithms = getCatalogTopics('algorithm');

// Badge art comes from the shared registry; slugs without bespoke art fall back to GenericTopicBadge.
function renderBadgeCards(topics: CatalogTopic[]) {
  return topics.map((topic) => (
    <BadgeCard key={topic.slug} {...topic} BadgeComponent={getBadgeForSlug(topic.slug)} />
  ));
}

export default function CourseCatalog({ hideButton = false }: { hideButton?: boolean }) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 md:px-12">
      <h2 className="mb-4 text-center font-serif text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
        Master Data Structures and Algorithms
      </h2>
      <p className="mb-16 text-center font-dmsans text-lg text-[var(--text-muted)]">
        Each badge takes you directly to that topic&apos;s visual page
      </p>

      <div className="w-full grid-cols-[1fr_1px_1fr] gap-8 md:grid">
        <div className="flex flex-col md:pr-12 lg:pr-16">
          <div className="mb-6 self-start">
            <span className="badge-pill badge-pill-amber">Data Structures</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{renderBadgeCards(dataStructures)}</div>
        </div>

        <div className="my-6 h-px bg-[var(--border)] md:my-0 md:h-auto md:w-px" />

        <div className="flex flex-col md:pl-12 lg:pl-16">
          <div className="mb-6 self-start">
            <span className="badge-pill badge-pill-amber">Algorithms</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{renderBadgeCards(algorithms)}</div>
        </div>
      </div>

      {!hideButton && (
        <div className="mt-16">
          <Link href="/learn" className="button-primary inline-flex items-center justify-center px-6 py-3">
            Explore Curriculum &rarr;
          </Link>
        </div>
      )}
    </section>
  );
}
