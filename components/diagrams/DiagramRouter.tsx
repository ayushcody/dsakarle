'use client';

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

const SUPPORTED_DIAGRAM_TYPES = new Set([
  'ArrayDiagram', 'SlidingWindowDiagram', 'TwoPointersDiagram', 'BinarySearchDiagram', 'array',
  'LinkedListDiagram', 'linked-list',
  'TreeDiagram', 'tree',
  'GraphDiagram', 'GraphDiagramInner', 'graph',
  'StackDiagram', 'stack',
  'DPDiagram', 'dp',
  'BacktrackingDiagram', 'backtracking',
]);

/** True when DiagramRouter has a real diagram for this type (callers can skip their wrapper otherwise). */
export function hasDiagram(diagramType: string): boolean {
  return SUPPORTED_DIAGRAM_TYPES.has(diagramType);
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
    case 'GraphDiagramInner':
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
      // No diagram available for this type yet — render nothing rather than a placeholder card.
      return null;
  }
}
