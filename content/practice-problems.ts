import t_arrays from "./topics/arrays.json";
import t_vectors from "./topics/vectors.json";
import t_strings from "./topics/strings.json";
import t_linked_lists from "./topics/linked-lists.json";
import t_stacks from "./topics/stacks.json";
import t_queues from "./topics/queues.json";
import t_hash_maps from "./topics/hash-maps.json";
import t_trees from "./topics/trees.json";
import t_bst from "./topics/bst.json";
import t_heaps from "./topics/heaps.json";
import t_graphs from "./topics/graphs.json";
import t_tries from "./topics/tries.json";
import t_sliding_window from "./topics/sliding-window.json";
import t_two_pointers from "./topics/two-pointers.json";
import t_prefix_sum from "./topics/prefix-sum.json";
import t_binary_search from "./topics/binary-search.json";
import t_sorting from "./topics/sorting.json";
import t_searching from "./topics/searching.json";
import t_recursion from "./topics/recursion.json";
import t_dynamic_programming from "./topics/dynamic-programming.json";
import t_greedy from "./topics/greedy.json";
import t_bfs_dfs from "./topics/bfs-dfs.json";
import courseStructure from "./course-structure.json";
import type { PracticeProblem } from "@/types/learning";

export interface PracticeHubProblem extends PracticeProblem {
  topicSlug: string
  topicTitle: string
}

const TOPIC_PRACTICE: Record<string, PracticeProblem[] | undefined> = {
  "arrays": t_arrays.practice as PracticeProblem[] | undefined,
  "vectors": t_vectors.practice as PracticeProblem[] | undefined,
  "strings": t_strings.practice as PracticeProblem[] | undefined,
  "linked-lists": t_linked_lists.practice as PracticeProblem[] | undefined,
  "stacks": t_stacks.practice as PracticeProblem[] | undefined,
  "queues": t_queues.practice as PracticeProblem[] | undefined,
  "hash-maps": t_hash_maps.practice as PracticeProblem[] | undefined,
  "trees": t_trees.practice as PracticeProblem[] | undefined,
  "bst": t_bst.practice as PracticeProblem[] | undefined,
  "heaps": t_heaps.practice as PracticeProblem[] | undefined,
  "graphs": t_graphs.practice as PracticeProblem[] | undefined,
  "tries": t_tries.practice as PracticeProblem[] | undefined,
  "sliding-window": t_sliding_window.practice as PracticeProblem[] | undefined,
  "two-pointers": t_two_pointers.practice as PracticeProblem[] | undefined,
  "prefix-sum": t_prefix_sum.practice as PracticeProblem[] | undefined,
  "binary-search": t_binary_search.practice as PracticeProblem[] | undefined,
  "sorting": t_sorting.practice as PracticeProblem[] | undefined,
  "searching": t_searching.practice as PracticeProblem[] | undefined,
  "recursion": t_recursion.practice as PracticeProblem[] | undefined,
  "dynamic-programming": t_dynamic_programming.practice as PracticeProblem[] | undefined,
  "greedy": t_greedy.practice as PracticeProblem[] | undefined,
  "bfs-dfs": t_bfs_dfs.practice as PracticeProblem[] | undefined,
};

const seen = new Set<string>();

export const PRACTICE_PROBLEMS: PracticeHubProblem[] = courseStructure.groups.flatMap((g) =>
  g.topics.flatMap((t) =>
    (TOPIC_PRACTICE[t.slug] ?? []).flatMap((p) => {
      if (seen.has(p.url)) return [];
      seen.add(p.url);
      return [{ ...p, topicSlug: t.slug, topicTitle: t.title }];
    }),
  ),
);
