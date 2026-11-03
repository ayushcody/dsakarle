import Link from 'next/link';

import { Glyph } from '@/components/glyph';
import { Chip } from '@/components/ui';
import { CURRICULUM } from '@/lib/curriculum';
import { PATTERN_GRAPH, matchesFilter } from './graph';
import type { MapFilter, MapNode } from './graph';

function LinkList({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <p className="t-small text-ink-3">
      <span>{label} </span>
      {ids.map((id, i) => {
        const n = PATTERN_GRAPH.byId.get(id);
        if (!n) return null;
        return (
          <span key={id}>
            {i > 0 ? <span aria-hidden="true">, </span> : null}
            <Link
              href={`/learn/${id}`}
              className="inline-flex min-h-[28px] items-center rounded-cell px-0.5 text-ink-2 underline decoration-rule-strong underline-offset-2 hover:text-coral-ink hover:decoration-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
            >
              {n.title}
            </Link>
          </span>
        );
      })}
    </p>
  );
}

function Item({ node }: { node: MapNode }) {
  return (
    <li className="border-b border-rule py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Glyph id={node.glyph} size={24} decorative className="text-ink-2" />
        <Link
          href={`/learn/${node.id}`}
          className="inline-flex min-h-[44px] items-center rounded-cell font-serif text-[18px] font-semibold text-ink hover:text-coral-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          {node.title}
        </Link>
        {node.status === 'live' ? <Chip variant="coral">Live</Chip> : <Chip className="border-dashed">Draft</Chip>}
      </div>
      <p className="t-small pl-9 text-ink-2">{node.oneLiner}</p>
      <div className="pl-9">
        <LinkList label="Learn first:" ids={node.prereqs} />
        <LinkList label="Related:" ids={node.related} />
      </div>
    </li>
  );
}

/** The same graph as grouped lists: every link, readable and keyboard-friendly. */
export default function MapListView({ filter }: { filter: MapFilter }) {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-12">
      {CURRICULUM.groups.map((group) => {
        const nodes = PATTERN_GRAPH.nodes.filter((n) => n.group === group.id && matchesFilter(n, filter));
        if (nodes.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`map-list-${group.id}`}>
            <h2 id={`map-list-${group.id}`} className="t-h3 border-b border-rule-strong pb-2 text-ink">
              {group.title}
            </h2>
            <ul>
              {nodes.map((node) => (
                <Item key={node.id} node={node} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
