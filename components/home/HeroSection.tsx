import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import courseStructure from '@/content/course-structure.json';
import { PRACTICE_PROBLEMS } from '@/content/practice-problems';

import { FloatingSymbols } from './FloatingSymbols';
import { TerminalWindow } from './TerminalWindow';

const TOPIC_COUNT = courseStructure.groups.reduce((n, g) => n + g.topics.length, 0);

export default function HeroSection() {
  return (
    <section className="min-h-[100vh] pt-[120px] flex flex-col items-center relative overflow-hidden bg-[var(--bg-primary)]">
      <FloatingSymbols />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-4xl mx-auto w-full text-center">
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
        
        <div className="fade-up-stagger-5 mt-2 flex w-full flex-col items-center gap-6">
          <TerminalWindow />
          <p className="font-dmsans text-[14px] text-[var(--text-muted)] tabular-nums">
            <strong className="text-[var(--accent-coral)]">{TOPIC_COUNT}</strong> topics · <strong className="text-[var(--accent-amber)]">{PRACTICE_PROBLEMS.length}</strong> curated LeetCode problems · code in 4 languages
          </p>
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
