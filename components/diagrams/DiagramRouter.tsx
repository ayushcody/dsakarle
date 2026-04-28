import { ArrayDiagram } from './ArrayDiagram';
import LinkedListDiagram from './LinkedListDiagram';
import { TreeDiagram } from './TreeDiagram';
import { GraphDiagramInner } from './GraphDiagramInner';
import StackDiagram from './StackDiagram';
import DPDiagram from './DPDiagram';
import BacktrackingDiagram from './BacktrackingDiagram';

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

export function DiagramRouter({ diagramType, cells, diagramState, left, right, windowStart, windowEnd, highlighted, comparing }: DiagramRouterProps) {
  switch (diagramType) {
    case 'ArrayDiagram':
    case 'SlidingWindowDiagram':
    case 'TwoPointersDiagram':
    case 'BinarySearchDiagram':
    case 'array':
      return <ArrayDiagram cells={cells} left={left} right={right}
        windowStart={windowStart} windowEnd={windowEnd}
        highlighted={highlighted} comparing={comparing} />;
    case 'LinkedListDiagram':
    case 'linked-list':
      return <LinkedListDiagram diagramState={diagramState || {}} />;
    case 'TreeDiagram':
    case 'tree':
      return <TreeDiagram cells={cells} />;
    case 'GraphDiagram':
    case 'graph':
      return <GraphDiagramInner cells={cells} />;
    case 'StackDiagram':
    case 'stack':
      return <StackDiagram diagramState={diagramState || {}} />;
    case 'DPDiagram':
    case 'dp':
      return <DPDiagram diagramState={diagramState || {}} />;
    case 'BacktrackingDiagram':
    case 'backtracking':
      return <BacktrackingDiagram diagramState={diagramState || {}} />;
    default:
      return (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center font-dmmono text-[13px] text-[var(--text-muted)]">
          Visualization for {diagramType} — coming soon
        </div>
      );
  }
}
