import React from 'react';
import Link from 'next/link';

import { getCatalogTopics } from '@/lib/content';
import type { CurriculumTopic } from '@/types';

import ArraysBadge from '../badges/ArraysBadge';
import LinkedListsBadge from '../badges/LinkedListsBadge';
import StacksQueuesBadge from '../badges/StacksQueuesBadge';
import TreesBadge from '../badges/TreesBadge';
import GraphsBadge from '../badges/GraphsBadge';
import HeapsBadge from '../badges/HeapsBadge';
import TriesBadge from '../badges/TriesBadge';
import HashMapsBadge from '../badges/HashMapsBadge';
import SortingBadge from '../badges/SortingBadge';
import SearchingBadge from '../badges/SearchingBadge';
import DPBadge from '../badges/DPBadge';
import SlidingWindowBadge from '../badges/SlidingWindowBadge';
import TwoPointersBadge from '../badges/TwoPointersBadge';
import BinarySearchBadge from '../badges/BinarySearchBadge';
import BacktrackingBadge from '../badges/BacktrackingBadge';
import GreedyBadge from '../badges/GreedyBadge';
import PrefixSumBadge from '../badges/PrefixSumBadge';

import BadgeCard from './BadgeCard';

const badgeMap = {
  arrays: ArraysBadge,
  'linked-lists': LinkedListsBadge,
  'stacks-queues': StacksQueuesBadge,
  trees: TreesBadge,
  graphs: GraphsBadge,
  heaps: HeapsBadge,
  tries: TriesBadge,
  'hash-maps': HashMapsBadge,
  sorting: SortingBadge,
  searching: SearchingBadge,
  'dynamic-programming': DPBadge,
  'sliding-window': SlidingWindowBadge,
  'two-pointers': TwoPointersBadge,
  'binary-search': BinarySearchBadge,
  backtracking: BacktrackingBadge,
  greedy: GreedyBadge,
  'prefix-sum': PrefixSumBadge,
} as const;

const dataStructures = getCatalogTopics('data-structure');
const algorithms = getCatalogTopics('algorithm');

function renderBadgeCards(topics: CurriculumTopic[]) {
  return topics.map((topic) => {
    const BadgeComponent = badgeMap[topic.slug as keyof typeof badgeMap];

    if (!BadgeComponent) {
      return null;
    }

    return <BadgeCard key={topic.slug} {...topic} BadgeComponent={BadgeComponent} />;
  });
}

export default function CourseCatalog() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 md:px-12">
      <h2 className="mb-4 text-center font-lora text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
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

      <div className="mt-16">
        <Link href="/learn" className="button-primary inline-flex items-center justify-center px-6 py-3">
          Explore Curriculum &rarr;
        </Link>
      </div>
    </section>
  );
}
