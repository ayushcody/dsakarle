export default function AboutPage() {
  return (
    <section className="min-h-screen bg-[var(--bg-primary)] px-6 py-28">
      <div className="mx-auto max-w-4xl rounded-[var(--radius)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-card)]">
        <span className="badge-pill badge-pill-teal">About</span>
        <h1 className="mt-6 font-lora text-4xl font-bold text-[var(--text-primary)]">DSAKarle teaches intuition before syntax</h1>
        <p className="mt-4 max-w-2xl font-dmsans text-lg leading-relaxed text-[var(--text-secondary)]">
          This build keeps the original visual-first direction intact while stabilizing the project structure, routing, and design system. The broader product surface can now be expanded from a clean root-level app.
        </p>
      </div>
    </section>
  );
}
