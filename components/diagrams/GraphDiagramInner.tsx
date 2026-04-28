'use client';

import { ReactFlow, Controls, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const baseNodeStyle = {
  background: 'var(--surface-purple)',
  color: 'white',
  border: '2px solid var(--accent-purple)',
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
  { id: 'A', position: { x: 250, y: 50 }, data: { label: 'A' }, style: baseNodeStyle },
  { id: 'B', position: { x: 100, y: 150 }, data: { label: 'B' }, style: baseNodeStyle },
  { id: 'C', position: { x: 400, y: 150 }, data: { label: 'C' }, style: baseNodeStyle },
  { id: 'D', position: { x: 250, y: 250 }, data: { label: 'D' }, style: baseNodeStyle }
];

const initialEdges: Edge[] = [
  { id: 'eA-B', source: 'A', target: 'B', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'eA-C', source: 'A', target: 'C', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'eB-D', source: 'B', target: 'D', style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'eC-D', source: 'C', target: 'D', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 2 } },
  { id: 'eB-C', source: 'B', target: 'C', style: { stroke: 'var(--text-muted)', strokeWidth: 2, strokeDasharray: '5,5' } }
];

export function GraphDiagramInner({}: { cells?: (string | number)[] }) {
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
