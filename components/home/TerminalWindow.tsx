'use client';

import { useEffect, useState } from 'react';

const CODE = [
  'def two_sum_sorted(nums, target):',
  '    left, right = 0, len(nums) - 1',
  '    while left < right:',
  '        total = nums[left] + nums[right]',
  '        if total == target:',
  '            return [left, right]',
  '        if total < target:',
  '            left += 1   # need bigger',
  '        else:',
  '            right -= 1  # need smaller',
];

function useTypewriter(lines: string[], charMs = 60, linePauseMs = 350) {
  const [pos, setPos] = useState({ line: 0, char: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPos({ line: lines.length, char: 0 });
      return;
    }
    if (pos.line >= lines.length) {
      const t = setTimeout(() => setPos({ line: 0, char: 0 }), 4000);
      return () => clearTimeout(t);
    }
    const endOfLine = pos.char >= lines[pos.line].length;
    const t = setTimeout(
      () => setPos(endOfLine ? { line: pos.line + 1, char: 0 } : { line: pos.line, char: pos.char + 1 }),
      endOfLine ? linePauseMs : charMs,
    );
    return () => clearTimeout(t);
  }, [pos, lines, charMs, linePauseMs]);

  return lines.slice(0, pos.line).concat(pos.line < lines.length ? [lines[pos.line].slice(0, pos.char)] : []);
}

export function TerminalWindow() {
  const shown = useTypewriter(CODE);

  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-[14px] border border-white/10 bg-[#1D1D1F] text-left shadow-[0_24px_60px_-20px_rgba(29,29,31,0.55)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#CC5A37]" />
        <span className="h-3 w-3 rounded-full bg-[#D99B26]" />
        <span className="h-3 w-3 rounded-full bg-[#1E7B6C]" />
        <span className="ml-3 font-dmmono text-[12px] text-[#a8a29e]">two_pointers.py</span>
      </div>
      <pre className="min-h-[268px] px-5 py-4 font-dmmono text-[13px] leading-[1.75] text-[#F5F0E8]" aria-label="Two pointer solution in Python">
        {shown.map((l, i) => (
          <div key={i}>
            <span className="mr-4 inline-block w-4 select-none text-right text-[#57534e]">{i + 1}</span>
            {l}
            {i === shown.length - 1 && <span className="terminal-caret" aria-hidden />}
          </div>
        ))}
      </pre>
    </div>
  );
}
