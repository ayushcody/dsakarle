import React, { useState } from 'react';

export function CodePanel() {
  const [activeTab, setActiveTab] = useState('Python');
  const tabs = ['Python', 'JavaScript', 'Java', 'C++'];

  return (
    <div className="bg-[#1A1A1A] rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#333] mb-8">
      {/* Header Tabs */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#333] bg-[#222]">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-dmsans text-xs px-4 py-2 rounded-md transition-all ${activeTab === tab ? 'bg-[#333] text-white font-medium shadow-sm' : 'text-[#888] hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 text-[#888] hover:text-white text-xs font-dmsans transition-colors px-3 py-1.5 rounded-md border border-[#444] hover:bg-[#333]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
          Copy
        </button>
      </div>

      {/* Code Editor Area */}
      <div className="p-6 overflow-x-auto text-sm leading-relaxed">
        <pre className="font-dmmono text-[#d4d4d4]">
          <code className="block">
            <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">length_of_longest_substring</span>(s: <span className="text-[#4ec9b0]">str</span>) -&gt; <span className="text-[#4ec9b0]">int</span>:{'\n'}
            {'    '}seen = {'{}'}{'\n'}
            {'    '}left = <span className="text-[#b5cea8]">0</span>{'\n'}
            {'    '}best = <span className="text-[#b5cea8]">0</span>{'\n\n'}
            {'    '}<span className="text-[#c586c0]">for</span> right, ch <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">enumerate</span>(s):{'\n'}
            {'        '}<span className="text-[#c586c0]">if</span> ch <span className="text-[#c586c0]">in</span> seen <span className="text-[#c586c0]">and</span> seen[ch] &gt;= left:{'\n'}
            {'            '}left = seen[ch] + <span className="text-[#b5cea8]">1</span>{'\n'}
            {'        '}seen[ch] = right{'\n'}
            {'        '}best = <span className="text-[#dcdcaa]">max</span>(best, right - left + <span className="text-[#b5cea8]">1</span>){'\n\n'}
            {'    '}<span className="text-[#c586c0]">return</span> best{'\n'}
          </code>
        </pre>
      </div>
    </div>
  );
}
