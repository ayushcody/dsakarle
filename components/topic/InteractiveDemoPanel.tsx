import React, { useState } from 'react';

export function InteractiveDemoPanel() {
  const [step] = useState(7);
  const totalSteps = 18;
  const stringData = ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'a'];
  const left = 2;
  const right = 5;

  return (
    <div className="bg-[#1A1A1A] rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#333] mb-8">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#333]">
        <h3 className="font-dmsans font-bold text-white text-sm">Interactive Demo</h3>
        <select className="bg-[#2A2A2A] text-white text-xs font-dmsans px-3 py-1.5 rounded-md border border-[#444] focus:outline-none focus:border-[var(--accent-coral)]">
          <option>Longest Substring (No Repeating)</option>
        </select>
      </div>

      {/* Main Demo Area */}
      <div className="p-8">
        <p className="font-dmsans text-[#888] text-sm mb-4">String</p>
        <div className="flex gap-3 mb-12 overflow-x-auto pb-4">
          {stringData.map((char, index) => {
            const inWindow = index >= left && index <= right;

            return (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center font-dmmono text-lg transition-all ${
                  inWindow ? 'bg-[#2A2A2A] text-white border-2 border-[var(--surface-teal)]' : 'bg-[#222] text-[#666] border border-[#333]'
                }`}>
                  {char}
                </div>
                <div className={`mt-2 font-dmmono text-xs ${inWindow ? 'text-[var(--surface-teal)] font-bold' : 'text-[#555]'}`}>
                  {index}
                </div>
              </div>
            );
          })}
        </div>

        {/* Variables Display */}
        <div className="flex gap-12 mb-12">
          <div>
            <p className="font-dmsans text-[#888] text-sm mb-2">Left</p>
            <div className="bg-[#1D7A6B] bg-opacity-20 text-[#1D7A6B] font-dmmono font-bold w-10 h-10 rounded flex items-center justify-center">{left}</div>
          </div>
          <div>
            <p className="font-dmsans text-[#888] text-sm mb-2">Right</p>
            <div className="bg-[#1D7A6B] bg-opacity-20 text-[#1D7A6B] font-dmmono font-bold w-10 h-10 rounded flex items-center justify-center">{right}</div>
          </div>
          <div>
            <p className="font-dmsans text-[#888] text-sm mb-2">Current Window</p>
            <div className="bg-[#2A2A2A] text-white font-dmmono font-bold h-10 px-4 rounded flex items-center justify-center border border-[#444]">
              &quot;cabc&quot;
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button className="w-12 h-12 rounded-lg bg-[var(--accent-coral)] text-white flex items-center justify-center hover:bg-[var(--accent-coral-dark)] transition-colors shadow-[0_0_15px_rgba(212,96,58,0.3)] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          
          <div className="flex-1 flex items-center gap-4">
            <div className="w-full h-1 bg-[#333] rounded-full relative cursor-pointer">
              <div className="absolute left-0 top-0 h-full bg-[var(--accent-coral)] rounded-full" style={{ width: `${(step/totalSteps)*100}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow" style={{ left: `calc(${(step/totalSteps)*100}% - 8px)` }}></div>
            </div>
            <span className="font-dmsans text-xs text-[#888] whitespace-nowrap">Step {step} / {totalSteps}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-10 h-10 rounded bg-[#2A2A2A] text-[#888] flex items-center justify-center hover:text-white hover:bg-[#333] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button className="w-10 h-10 rounded bg-[#2A2A2A] text-[#888] flex items-center justify-center hover:text-white hover:bg-[#333] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
