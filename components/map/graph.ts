import { LESSONS, getGroup } from '@/lib/curriculum';
import type { CurriculumGroupId, CurriculumLesson } from '@/types/learning';

export type MapFilter = 'all' | CurriculumGroupId | 'live';

export interface MapNode {
  id: string
  title: string
  group: CurriculumGroupId
  groupTitle: string
  glyph: CurriculumLesson['glyph']
  status: CurriculumLesson['status']
  oneLiner: string
  /** Row in the learning order: 0 has no prerequisites, 1 needs only row-0 lessons, and so on. */
  level: number
  /** What to learn first. */
  prereqs: string[]
  /** What this lesson unlocks. */
  unlocks: string[]
  related: string[]
}

export type MapEdgeKind = 'prereq' | 'related';

export interface MapEdge {
  id: string
  /** For a prereq edge this is the lesson to learn first. */
  source: string
  target: string
  kind: MapEdgeKind
}

export interface PatternGraph {
  nodes: MapNode[]
  edges: MapEdge[]
  byId: Map<string, MapNode>
  maxLevel: number
}

function buildGraph(): PatternGraph {
  const slugs = new Set(LESSONS.map((l) => l.slug));
  const lessonBySlug = new Map(LESSONS.map((l) => [l.slug, l]));

  // Learning-order level = longest prerequisite chain. Guarded against cycles.
  const levelCache = new Map<string, number>();
  const visiting = new Set<string>();
  const levelOf = (slug: string): number => {
    const cached = levelCache.get(slug);
    if (cached !== undefined) return cached;
    if (visiting.has(slug)) return 0;
    visiting.add(slug);
    const prereqs = (lessonBySlug.get(slug)?.prereqs ?? []).filter((p) => slugs.has(p));
    const level = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(levelOf));
    visiting.delete(slug);
    levelCache.set(slug, level);
    return level;
  };

  const edges: MapEdge[] = [];
  const prereqPairs = new Set<string>();
  for (const lesson of LESSONS) {
    for (const p of lesson.prereqs) {
      if (!slugs.has(p)) continue;
      edges.push({ id: `p:${p}>${lesson.slug}`, source: p, target: lesson.slug, kind: 'prereq' });
      prereqPairs.add(`${p}|${lesson.slug}`);
      prereqPairs.add(`${lesson.slug}|${p}`);
    }
  }
  // Related is undirected: draw once per pair, and skip pairs already joined by a prereq edge.
  const relatedSeen = new Set<string>();
  for (const lesson of LESSONS) {
    for (const r of lesson.related) {
      if (!slugs.has(r) || r === lesson.slug) continue;
      const [a, b] = [lesson.slug, r].sort();
      const key = `${a}|${b}`;
      if (relatedSeen.has(key) || prereqPairs.has(key)) continue;
      relatedSeen.add(key);
      edges.push({ id: `r:${a}~${b}`, source: a, target: b, kind: 'related' });
    }
  }

  // Neighbour lists use every declared link, in either direction, so hover/lists agree.
  const unlocks = new Map<string, string[]>();
  const related = new Map<string, Set<string>>();
  for (const lesson of LESSONS) {
    for (const p of lesson.prereqs) {
      if (!slugs.has(p)) continue;
      unlocks.set(p, [...(unlocks.get(p) ?? []), lesson.slug]);
    }
  }
  for (const e of edges) {
    if (e.kind !== 'related') continue;
    related.set(e.source, (related.get(e.source) ?? new Set()).add(e.target));
    related.set(e.target, (related.get(e.target) ?? new Set()).add(e.source));
  }

  const nodes: MapNode[] = LESSONS.map((l) => ({
    id: l.slug,
    title: l.title,
    group: l.group,
    groupTitle: getGroup(l.group)?.title ?? l.group,
    glyph: l.glyph,
    status: l.status,
    oneLiner: l.oneLiner,
    level: levelOf(l.slug),
    prereqs: l.prereqs.filter((p) => slugs.has(p)),
    unlocks: unlocks.get(l.slug) ?? [],
    related: [...(related.get(l.slug) ?? [])],
  }));

  return {
    nodes,
    edges,
    byId: new Map(nodes.map((n) => [n.id, n])),
    maxLevel: Math.max(0, ...nodes.map((n) => n.level)),
  };
}

/** Derived once from the curriculum: nodes are lessons, edges are prereqs (directed) and related (undirected). */
export const PATTERN_GRAPH: PatternGraph = buildGraph();

export function matchesFilter(node: MapNode, filter: MapFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'live') return node.status === 'live';
  return node.group === filter;
}

/** Ids one step away from `id` in any direction, plus `id` itself. */
export function neighbourhood(id: string): Set<string> {
  const node = PATTERN_GRAPH.byId.get(id);
  const out = new Set<string>([id]);
  if (!node) return out;
  for (const s of [...node.prereqs, ...node.unlocks, ...node.related]) out.add(s);
  return out;
}
