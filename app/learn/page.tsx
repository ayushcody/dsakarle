import React from 'react';
import CourseCatalog from '@/components/home/CourseCatalog';

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center md:text-left">
        <h1 className="font-lora text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">Curriculum</h1>
        <p className="font-dmsans text-[var(--text-secondary)] text-lg max-w-2xl">
          Master the core patterns of computer science. Select a topic below to jump into the visual guides and interactive steppers.
        </p>
      </div>
      <CourseCatalog />
    </div>
  );
}
