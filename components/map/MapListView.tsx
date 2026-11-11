import Link from 'next/link';

import { Glyph } from '@/components/glyph';
import { Chip } from '@/components/ui';
import { PATHS } from '@/lib/curriculum';
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
              className="-my-2 inline-flex min-h-[44px] min-w-10 items-center rounded-cell px-1 text-ink-2 underline decoration-rule-strong underline-offset-2 hover:text-coral-ink hover:decoration-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
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
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Glyph id={node.glyph} size={24} decorative className="text-ink-2" />
        <Link
          href={`/learn/${node.id}`}
          className="inline-flex min-h-[44px] min-w-10 items-center rounded-cell text-[16px] font-semibold text-ink hover:text-coral-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          {node.title}
        </Link>
        {node.status === 'live' ? null : <Chip className="border-dashed">Draft</Chip>}
      </div>
      <p className="t-small pl-9 text-ink-2">{node.oneLiner}</p>
      <div className="pl-9">
        <LinkList label="Learn first:" ids={node.prereqs} />
        <LinkList label="Related:" ids={node.related} />
      </div>
    </li>
  );
}

/** The same graph as lists grouped path by section: every link, readable and keyboard-friendly. */
export default function MapListView({ filter }: { filter: MapFilter }) {
  return (
    <div className="max-w-[760px] space-y-12">
      {PATHS.map((path) => {
        const sections = path.sections
          .map((section) => ({
            section,
            nodes: section.lessons
              .map((slug) => PATTERN_GRAPH.byId.get(slug))
              .filter((n): n is MapNode => Boolean(n) && matchesFilter(n as MapNode, filter)),
          }))
          .filter((s) => s.nodes.length > 0);
        if (sections.length === 0) return null;
        return (
          <section key={path.id} aria-labelledby={`map-list-${path.id}`}>
            <h2 id={`map-list-${path.id}`} className="t-h2 text-ink">
              {path.title}
            </h2>
            <div className="mt-4 space-y-6">
              {sections.map(({ section, nodes }) => (
                <div key={section.title}>
                  <h3 className="t-eyebrow mb-1">{section.title}</h3>
                  <ul className="divide-y divide-rule border-y border-rule">
                    {nodes.map((node) => (
                      <Item key={node.id} node={node} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
