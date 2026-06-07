import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
          Visual-first Learning
        </span>
        
        <h1 className="fade-up-stagger-2 font-dmsans font-bold text-[clamp(40px,6vw,72px)] leading-[1.1] tracking-tight mb-6">
          <span className="block text-[var(--text-primary)]">Master Data Structures</span>
          <span className="block text-[var(--text-primary)]">and Algorithms</span>
        </h1>
        
        <p className="fade-up-stagger-3 font-dmsans text-[18px] text-[var(--text-secondary)] max-w-[640px] mb-10">
          Build strong problem solving skills and visual intuition for arrays, linked lists, trees, graphs, dynamic programming, and interview patterns through interactive visuals.
        </p>
        
        <div className="fade-up-stagger-4 flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/learn" className="px-8 py-4 bg-[var(--accent-coral)] text-[var(--white)] font-dmsans font-medium text-lg rounded-full transition-all hover:bg-[var(--accent-coral-dark)] hover:-translate-y-0.5 shadow-sm">
            Start Learning &rarr;
          </Link>
          <Link href="/learn" className="px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent-coral)] font-dmsans font-medium text-lg rounded-full transition-all hover:bg-[var(--white)] hover:-translate-y-0.5 shadow-sm">
            Explore Curriculum
          </Link>
        </div>
        
        <div className="fade-up-stagger-5 font-dmsans text-[14px] text-[var(--text-muted)] flex flex-wrap justify-center items-center gap-8 mt-4">
          <div className="flex flex-col items-center"><span className="font-bold text-[var(--accent-coral)] text-2xl">13+</span><span className="font-medium mt-1">Topics</span></div>
          <div className="flex flex-col items-center"><span className="font-bold text-[var(--accent-amber)] text-2xl">200+</span><span className="font-medium mt-1">Visual Lessons</span></div>
          <div className="flex flex-col items-center"><span className="font-bold text-[var(--accent-coral)] text-2xl">1000+</span><span className="font-medium mt-1">Practice Problems</span></div>
          <div className="flex flex-col items-center"><span className="font-bold text-[var(--accent-amber)] text-2xl">50K+</span><span className="font-medium mt-1">Learners</span></div>
        </div>
      </div>

      <div className="fade-up-stagger-6 relative z-0 mt-16 w-full max-w-[1200px] px-6 mx-auto flex justify-center">
        <Image 
          src="/DSAcademyImage.png" 
          alt="DSA Academy Campus" 
          width={1200} 
          height={600} 
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </section>
  );
}
