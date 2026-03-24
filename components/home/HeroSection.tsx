import React from 'react';
import Link from 'next/link';
import IsometricCampus from './IsometricCampus';

export default function HeroSection() {
  return (
    <section className="min-h-[100vh] pt-[120px] flex flex-col items-center relative overflow-hidden bg-[var(--bg-primary)]">
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      ></div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-4xl mx-auto w-full text-center">
        <span className="fade-up-stagger-1 badge-pill badge-pill-teal mb-6 inline-flex font-medium text-[13px]">
          Ab DSA se darna band karo
        </span>
        
        <h1 className="fade-up-stagger-2 font-lora font-bold text-[clamp(48px,7vw,84px)] leading-[1.08] tracking-[-0.02em] mb-6">
          <span className="block text-[var(--text-primary)]">DSA?</span>
          <span className="block text-[var(--accent-coral)] italic">Karle.</span>
        </h1>
        
        <p className="fade-up-stagger-3 font-dmsans text-[19px] text-[var(--text-secondary)] max-w-[560px] mb-10">
          The visual-first learning platform for Indian engineering students. Master Data Structures and Algorithms through scrubable step-by-step diagrams.
        </p>
        
        <div className="fade-up-stagger-4 flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/learn" className="px-8 py-4 bg-[var(--accent-coral)] text-white font-dmsans font-medium text-lg rounded-[var(--radius-sm)] transition-all hover:bg-[var(--accent-coral-dark)] hover:translate-x-[2px] shadow-sm">
            Patterns Dekho &rarr;
          </Link>
          <a href="#how-it-works" className="px-8 py-4 bg-transparent border-2 border-[var(--accent-coral)] text-[var(--accent-coral)] font-dmsans font-medium text-lg rounded-[var(--radius-sm)] transition-all hover:bg-[var(--accent-coral)] hover:text-white hover:translate-x-[2px]">
            Kaise kaam karta hai &darr;
          </a>
        </div>
        
        <div className="fade-up-stagger-5 font-dmmono text-[13px] text-[var(--text-muted)] flex flex-wrap justify-center items-center gap-3">
          <span>13 patterns</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
          <span>50+ worked examples</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
          <span>Visual-first</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
          <span>Free to start</span>
        </div>
      </div>

      <div className="fade-up-stagger-6 relative z-0 mt-16 flex w-full max-w-[1000px] justify-center">
        <IsometricCampus />
      </div>
    </section>
  );
}
