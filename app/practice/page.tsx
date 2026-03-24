export default function PracticePage() {
  return (
    <section className="min-h-screen bg-[var(--bg-primary)] px-6 py-28">
      <div className="mx-auto max-w-4xl rounded-[var(--radius)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-card)]">
        <span className="badge-pill badge-pill-amber">Practice</span>
        <h1 className="mt-6 font-lora text-4xl font-bold text-[var(--text-primary)]">Practice browser is being expanded</h1>
        <p className="mt-4 max-w-2xl font-dmsans text-lg leading-relaxed text-[var(--text-secondary)]">
          The dedicated practice experience is not built out yet, but the current topic pages already link to live problems. This route is now stable and ready for the next pass.
        </p>
      </div>
    </section>
  );
}
