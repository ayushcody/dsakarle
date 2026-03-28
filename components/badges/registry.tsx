import type { ComponentType, SVGProps } from 'react';

import ArraysBadge from './ArraysBadge';
import LinkedListsBadge from './LinkedListsBadge';
import StacksQueuesBadge from './StacksQueuesBadge';
import TreesBadge from './TreesBadge';
import GraphsBadge from './GraphsBadge';
import HeapsBadge from './HeapsBadge';
import TriesBadge from './TriesBadge';
import HashMapsBadge from './HashMapsBadge';
import SortingBadge from './SortingBadge';
import SearchingBadge from './SearchingBadge';
import DPBadge from './DPBadge';
import SlidingWindowBadge from './SlidingWindowBadge';
import TwoPointersBadge from './TwoPointersBadge';
import BinarySearchBadge from './BinarySearchBadge';
import BacktrackingBadge from './BacktrackingBadge';
import GreedyBadge from './GreedyBadge';
import PrefixSumBadge from './PrefixSumBadge';
import GenericTopicBadge from './GenericTopicBadge';

type BadgeComponent = ComponentType<SVGProps<SVGSVGElement>>;

const badgeRegistry: Record<string, BadgeComponent> = {
  arrays: ArraysBadge,
  vectors: ArraysBadge,
  strings: ArraysBadge,
  'linked-lists': LinkedListsBadge,
  stacks: StacksQueuesBadge,
  queues: StacksQueuesBadge,
  'hash-maps': HashMapsBadge,
  trees: TreesBadge,
  bst: TreesBadge,
  heaps: HeapsBadge,
  graphs: GraphsBadge,
  tries: TriesBadge,
  'sliding-window': SlidingWindowBadge,
  'two-pointers': TwoPointersBadge,
  'prefix-sum': PrefixSumBadge,
  'binary-search': BinarySearchBadge,
  sorting: SortingBadge,
  searching: SearchingBadge,
  recursion: BacktrackingBadge,
  'dynamic-programming': DPBadge,
  greedy: GreedyBadge,
  'bfs-dfs': GraphsBadge,
};

export function getBadgeForSlug(slug: string): BadgeComponent {
  return badgeRegistry[slug] || GenericTopicBadge;
}
