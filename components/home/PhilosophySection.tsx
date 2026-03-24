import React from 'react';

export default function PhilosophySection() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
      
      {/* Visual over Jargon */}
      <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
        <div className="flex-1">
          <h2 className="font-lora text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">Build Intuition First</h2>
          <p className="font-dmsans text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
            Read a textbook, and you get a wall of formal proofs. Read our guides, and you get an interactive playground. We believe that if you can visually see the underlying shape of an algorithm, the code writes itself.
          </p>
          <ul className="space-y-4 font-dmsans text-[var(--text-primary)]">
            <li className="flex items-center gap-3">
              <span className="text-[var(--accent-teal)] font-bold">✓</span> No dense math walls
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[var(--accent-teal)] font-bold">✓</span> Spatial learning focus
            </li>
          </ul>
        </div>
        <div className="flex-1 bg-[#F0EDE8] p-8 rounded-[var(--radius)] border border-[#E5E0D8] flex items-center justify-center min-h-[300px]">
           {/* Simple static layout diagram */}
           <div className="bg-white p-6 rounded shadow-sm border border-[#E5E0D8] flex gap-4 w-full opacity-80">
             <div className="w-1/3 flex flex-col gap-2">
               <div className="h-4 bg-[#E5E0D8] rounded w-full"></div>
               <div className="h-4 bg-[#E5E0D8] rounded w-3/4"></div>
             </div>
             <div className="w-2/3 flex gap-2">
                <div className="h-24 w-full bg-[rgba(200,144,10,0.12)] border border-[#C8900A] rounded flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-[#D4603A]"></div>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Code in 4 Languages */}
      <div className="flex flex-col md:flex-row-reverse items-center gap-16">
        <div className="flex-1">
          <h2 className="font-lora text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">Learn in Your Language</h2>
          <p className="font-dmsans text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
            Language syntax shouldn&apos;t be a barrier to algorithm mastery. That&apos;s why every single implementation, template, and solution on DSAKarle is strictly provided in the top 4 competitive programming languages.
          </p>
          <div className="flex flex-wrap gap-2 font-dmmono text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded text-gray-700">Python</span>
            <span className="px-3 py-1 bg-gray-100 rounded text-gray-700">JavaScript</span>
            <span className="px-3 py-1 bg-gray-100 rounded text-gray-700">Java</span>
            <span className="px-3 py-1 bg-gray-100 rounded text-gray-700">C++</span>
          </div>
        </div>
        <div className="flex-1 bg-[#1A1A18] p-8 rounded-[var(--radius)] flex items-center justify-center min-h-[300px] w-full shadow-lg">
           {/* Mock Code block diagram */}
           <div className="w-full">
            <div className="flex gap-2 mb-4">
               <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
               <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
               <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="font-dmmono text-sm text-[#A3A3A3] flex flex-col gap-2">
               <div><span className="text-[#D4603A]">def</span> <span className="text-[#1D7A6B]">sliding_window</span>(arr, k):</div>
               <div className="pl-4">curr_sum = <span className="text-[#C8900A]">sum</span>(arr[:k])</div>
               <div className="pl-4">max_sum = curr_sum</div>
               <div className="pl-4">...</div>
            </div>
           </div>
        </div>
      </div>

    </section>
  );
}
