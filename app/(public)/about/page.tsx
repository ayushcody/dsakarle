import React from 'react';
import Link from 'next/link';
import IsometricCampus from '@/components/home/IsometricCampus';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-12 pb-24">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <span className="badge-pill badge-pill-teal mb-6 inline-flex font-medium text-[13px]">
            About DSA Karle
          </span>
          <h1 className="font-dmsans text-5xl md:text-6xl font-bold text-[var(--text-primary)] mb-6 tracking-tight leading-[1.1]">
            Intuition first.<br/>Code with confidence.
          </h1>
          <p className="font-dmsans text-[var(--text-secondary)] text-lg mb-10 max-w-lg">
            DSA Karle is built to help you see the patterns behind every problem. We focus on building strong intuition through visuals, interactive examples, and guided practice—so implementation becomes natural.
          </p>
          <Link href="/learn" className="inline-flex px-8 py-4 bg-[var(--accent-coral)] text-white font-dmsans font-medium text-lg rounded-full transition-all hover:bg-[var(--accent-coral-dark)] hover:-translate-y-0.5 shadow-sm">
            Start Your Journey &rarr;
          </Link>
        </div>
        <div className="flex-1 w-full max-w-lg">
          <IsometricCampus />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-6 mb-24 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--white)] p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-teal)] text-[var(--accent-teal)] flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <h3 className="font-dmsans font-bold text-[var(--text-primary)] mb-3">Visual-first learning</h3>
          <p className="font-dmsans text-[var(--text-secondary)] text-sm">Understand concepts through powerful visuals, animations, and real-world examples.</p>
        </div>
        
        <div className="bg-[var(--white)] p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-coral)] text-[var(--accent-coral)] flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="font-dmsans font-bold text-[var(--text-primary)] mb-3">Guided practice</h3>
          <p className="font-dmsans text-[var(--text-secondary)] text-sm">Solve curated problems with hints and step-by-step explanations.</p>
        </div>

        <div className="bg-[var(--white)] p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-amber)] text-[var(--accent-amber)] flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <h3 className="font-dmsans font-bold text-[var(--text-primary)] mb-3">Multi-language support</h3>
          <p className="font-dmsans text-[var(--text-secondary)] text-sm">Write and practice code in Python, JavaScript, Java, C++, and more.</p>
        </div>

        <div className="bg-[var(--white)] p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-success)] text-[var(--state-success)] flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-dmsans font-bold text-[var(--text-primary)] mb-3">Pattern recognition</h3>
          <p className="font-dmsans text-[var(--text-secondary)] text-sm">Spot patterns faster with structured learning paths and spaced repetition.</p>
        </div>
      </div>

      {/* Two Panel Section */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius)] p-10 shadow-sm">
          <p className="font-dmsans text-[var(--accent-coral)] text-sm font-bold tracking-widest uppercase mb-4">Why we exist</p>
          <h2 className="font-dmsans text-3xl font-bold text-[var(--text-primary)] mb-6">Bridging the gap between knowing and implementing</h2>
          <p className="font-dmsans text-[var(--text-secondary)] mb-8 leading-relaxed">
            Most resources teach syntax before understanding. We flip that. By building intuition first, we help you solve problems confidently and write clean, efficient code—on your own.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--state-success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span className="font-dmsans text-[var(--text-primary)] font-medium">Strong foundations that last</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--state-success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span className="font-dmsans text-[var(--text-primary)] font-medium">Better problem-solving, not just solutions</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--state-success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span className="font-dmsans text-[var(--text-primary)] font-medium">Confident coders, not copy-pasters</span>
            </li>
          </ul>
        </div>

        <div className="bg-[var(--surface-success)] bg-opacity-20 border border-[var(--surface-success)] rounded-[var(--radius)] p-10 shadow-sm">
          <p className="font-dmsans text-[var(--state-success)] text-sm font-bold tracking-widest uppercase mb-4">What you can expect</p>
          <h2 className="font-dmsans text-3xl font-bold text-[var(--text-primary)] mb-8">A focused path to mastery</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--white)] shadow-sm flex items-center justify-center flex-shrink-0 text-[var(--state-success)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <div>
                <h4 className="font-dmsans font-bold text-[var(--text-primary)] mb-1">Structured learning paths</h4>
                <p className="font-dmsans text-[var(--text-secondary)] text-sm">Beginner to advanced paths designed for clarity and depth.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--white)] shadow-sm flex items-center justify-center flex-shrink-0 text-[var(--state-success)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <div>
                <h4 className="font-dmsans font-bold text-[var(--text-primary)] mb-1">Practice that scales</h4>
                <p className="font-dmsans text-[var(--text-secondary)] text-sm">From basics to advanced challenges and interview problems.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--white)] shadow-sm flex items-center justify-center flex-shrink-0 text-[var(--state-success)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h4 className="font-dmsans font-bold text-[var(--text-primary)] mb-1">Progress you can see</h4>
                <p className="font-dmsans text-[var(--text-secondary)] text-sm">Track streaks, mastery, and growth with insightful analytics.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
