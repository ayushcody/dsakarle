'use client';

import { ReactFlow, Controls, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const baseNodeStyle = {
  background: 'var(--surface-teal)',
  color: 'white',
  border: '2px solid var(--accent-teal)',
  borderRadius: '50%',
  width: 50,
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontFamily: 'var(--font-dm-mono)'
};

const initialNodes: Node[] = [
  {
    id: 'root',
    position: { x: 250, y: 50 },
    data: { label: '10' },
    style: baseNodeStyle
  },
  {
    id: 'left',
    position: { x: 150, y: 150 },
    data: { label: '5' },
    style: baseNodeStyle
  },
  {
    id: 'right',
    position: { x: 350, y: 150 },
    data: { label: '15' },
    style: baseNodeStyle
  },
  {
    id: 'll',
    position: { x: 100, y: 250 },
    data: { label: '2' },
    style: baseNodeStyle
  },
  {
    id: 'lr',
    position: { x: 200, y: 250 },
    data: { label: '7' },
    style: baseNodeStyle
  }
];

const initialEdges: Edge[] = [
  { id: 'e-root-l', source: 'root', target: 'left', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'e-root-r', source: 'root', target: 'right', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'e-left-l', source: 'left', target: 'll', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'e-left-r', source: 'left', target: 'lr', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } }
];

export function TreeDiagram({}: { cells?: (string | number)[] }) {
  // If we needed to render based on cells array we could, but a static beautiful default is preferred when empty.
  return (
    <div className="w-full h-[350px] rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
