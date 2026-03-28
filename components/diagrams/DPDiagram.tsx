interface DPDiagramProps {
  diagramState: Record<string, unknown>
}

export default function DPDiagram({ diagramState }: DPDiagramProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center">
      <p className="font-dmmono text-[13px] text-[var(--text-muted)]">DP visualization coming soon.</p>
      <p className="mt-3 font-dmsans text-sm text-[var(--text-secondary)]">{JSON.stringify(diagramState)}</p>
    </div>
  );
}
