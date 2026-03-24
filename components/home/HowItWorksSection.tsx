import React from 'react';

export default function HowItWorksSection() {
  return (
    <section className="bg-[var(--bg-secondary)] py-24 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-lora text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">How DSAKarle Works</h2>
          <p className="font-dmsans text-[var(--text-muted)] text-lg">A smarter way to build intuition before writing code</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-[#1D7A6B1A] rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h3 className="font-dmsans font-semibold text-xl mb-3 text-[var(--text-primary)]">1. See the Pattern</h3>
            <p className="font-dmsans text-[var(--text-secondary)] leading-relaxed">Every algorithm is a spatial pattern. We introduce them visually using intuitive diagrams before dropping any jargon.</p>
          </div>

          <div className="bg-white p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-[#C8900A1A] rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-dmsans font-semibold text-xl mb-3 text-[var(--text-primary)]">2. Scrub through Steps</h3>
            <p className="font-dmsans text-[var(--text-secondary)] leading-relaxed">Use the interactive slider to watch the algorithm execute step-by-step. See exactly how variables and pointers change in real-time.</p>
          </div>

          <div className="bg-white p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-[#D4603A1A] rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="font-dmsans font-semibold text-xl mb-3 text-[var(--text-primary)]">3. Write the Code</h3>
            <p className="font-dmsans text-[var(--text-secondary)] leading-relaxed">Once the intuition clicks, we show you the code in Python, JavaScript, Java, and C++. The implementation becomes obvious.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
