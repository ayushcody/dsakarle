'use client';

import { ArrayDiagram } from './ArrayDiagram';
import LinkedListDiagram from './LinkedListDiagram';
import StackDiagram from './StackDiagram';
import DPDiagram from './DPDiagram';
import { GraphDiagram, HashMapDiagram, TreeDiagram } from './NodeGraphDiagram';

interface DiagramRouterProps {
  diagramType: string
  cells: (number | string)[]
  diagramState?: Record<string, unknown>
  left?: number
  right?: number
  windowStart?: number
  windowEnd?: number
  highlighted?: number[]
  comparing?: number[]
}

type Aux = { label: string; items: (string | number)[] };

function Body({ diagramType, cells, diagramState = {}, ...props }: DiagramRouterProps) {
  const s = diagramState as Record<string, never>;
  const arr = (s.cells as (number | string)[] | undefined) ?? cells;

  switch (diagramType) {
    case 'ArrayDiagram':
    case 'SlidingWindowDiagram':
    case 'TwoPointersDiagram':
    case 'BinarySearchDiagram':
    case 'array':
      return (
        <ArrayDiagram
          cells={arr}
          left={props.left ?? s.left ?? -1}
          right={props.right ?? s.right ?? -1}
          windowStart={props.windowStart ?? s.windowStart}
          windowEnd={props.windowEnd ?? s.windowEnd}
          highlighted={props.highlighted?.length ? props.highlighted : s.highlighted ?? []}
          comparing={props.comparing?.length ? props.comparing : s.comparing ?? []}
        />
      );
    case 'LinkedListDiagram':
    case 'linked-list':
      return <LinkedListDiagram diagramState={diagramState} />;
    case 'TreeDiagram':
    case 'tree':
    case 'BacktrackingDiagram':
    case 'backtracking':
      return <TreeDiagram cells={arr} diagramState={diagramState} />;
    case 'GraphDiagram':
    case 'GraphDiagramInner':
    case 'graph':
      return <GraphDiagram diagramState={diagramState} />;
    case 'hash-map':
    case 'HashMapDiagram':
      return <HashMapDiagram diagramState={diagramState} />;
    case 'StackDiagram':
    case 'stack':
      return <StackDiagram diagramState={diagramState} />;
    case 'DPDiagram':
    case 'dp':
      return <DPDiagram diagramState={diagramState} />;
    default:
      return null;
  }
}

export function DiagramRouter(props: DiagramRouterProps) {
  const aux = (props.diagramState?.aux as Aux[] | undefined) ?? [];
  return (
    <div className="flex flex-col items-center gap-4">
      <Body {...props} />
      {aux.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {aux.map((a) => (
            <div key={a.label} className="flex items-center gap-2 font-dmmono text-xs">
              <span className="uppercase tracking-widest text-[var(--text-muted)]">{a.label}</span>
              <span className="flex gap-1">
                {a.items.length === 0 && <span className="text-[var(--text-muted)]">[ ]</span>}
                {a.items.map((it, i) => (
                  <span key={`${it}-${i}`} className="rounded border border-[var(--border)] bg-[var(--white)] px-2 py-0.5 text-sm text-[var(--text-primary)]">{it}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
