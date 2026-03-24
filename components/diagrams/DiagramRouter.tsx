import ArrayDiagram from './ArrayDiagram';
import LinkedListDiagram from './LinkedListDiagram';
import TreeDiagram from './TreeDiagram';
import GraphDiagram from './GraphDiagram';

interface DiagramRouterProps {
  diagramType: string
  cells: (number | string)[]
  diagramState: Record<string, unknown>
}

export function DiagramRouter({ diagramType, cells, diagramState }: DiagramRouterProps) {
  switch (diagramType) {
    case 'ArrayDiagram':
    case 'SlidingWindowDiagram':
    case 'TwoPointersDiagram':
    case 'BinarySearchDiagram':
    case 'array':
      return <ArrayDiagram cells={cells} diagramState={diagramState} />;
    case 'LinkedListDiagram':
    case 'linked-list':
      return <LinkedListDiagram diagramState={diagramState} />;
    case 'TreeDiagram':
    case 'tree':
      return <TreeDiagram diagramState={diagramState} />;
    case 'GraphDiagram':
    case 'graph':
      return <GraphDiagram diagramState={diagramState} />;
    default:
      return (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center font-dmmono text-[13px] text-[var(--text-muted)]">
          Visualization for {diagramType} — coming soon
        </div>
      );
  }
}
