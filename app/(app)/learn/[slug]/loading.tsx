export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)] md:ml-[280px]">
      <div className="mx-auto flex max-w-[800px] flex-col gap-8 px-6 py-10 lg:px-12" aria-busy="true" aria-label="Loading topic">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="flex items-start gap-6">
          <div className="skeleton h-20 w-20 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-10 w-2/3 rounded-lg" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-4/5 rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
        <div className="skeleton h-[320px] rounded-[var(--radius)]" />
      </div>
    </div>
  );
}
