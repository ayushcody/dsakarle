const fs = require('fs');
const path = require('path');

const badgesDir = path.join(__dirname, '..', 'components', 'badges');
if (!fs.existsSync(badgesDir)) {
  fs.mkdirSync(badgesDir, { recursive: true });
}

const baseSvg = (children) => `
    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      ${children}
    </svg>
`;

const defaultFill = 'rgba(200,144,10,0.12)';
const defaultStroke = '#C8900A';
const highlightFill = 'rgba(200,144,10,0.35)';
const highlightStroke = '#C8900A';

const badges = {
  ArraysBadge: `<rect x="23" y="40" width="8" height="10" rx="2" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <rect x="35" y="40" width="8" height="10" rx="2" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <rect x="47" y="40" width="8" height="10" rx="2" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <rect x="59" y="40" width="8" height="10" rx="2" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>`,
      
  LinkedListsBadge: `<rect x="24" y="40" width="10" height="10" rx="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 34 45 L 42 45" stroke="${defaultStroke}" strokeWidth="1.2" markerEnd="url(#arrow)"/>
      <rect x="42" y="40" width="10" height="10" rx="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 52 45 L 60 45" stroke="${defaultStroke}" strokeWidth="1.2" markerEnd="url(#arrow)"/>
      <rect x="60" y="40" width="10" height="10" rx="3" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${defaultStroke}" />
        </marker>
      </defs>`,
      
  StacksQueuesBadge: `<rect x="35" y="52" width="20" height="6" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <rect x="37" y="44" width="16" height="6" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <rect x="39" y="36" width="12" height="6" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <path d="M 56 39 L 64 39" stroke="${defaultStroke}" strokeWidth="1.5" markerEnd="url(#arrow)"/>`,
      
  TreesBadge: `<circle cx="45" cy="30" r="5" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <path d="M 41 33 L 33 42" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 49 33 L 57 42" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="30" cy="45" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="60" cy="45" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 28 48 L 22 56" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 32 48 L 38 56" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 58 48 L 52 56" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 62 48 L 68 56" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="20" cy="58" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="40" cy="58" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="50" cy="58" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="70" cy="58" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>`,
      
  GraphsBadge: `<circle cx="45" cy="28" r="5" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <circle cx="28" cy="40" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="62" cy="40" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="35" cy="62" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="55" cy="62" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 42 32 L 31 38 M 48 32 L 59 38 M 31 43 L 34 58 M 59 43 L 56 58 M 38 62 L 51 62" stroke="${defaultStroke}" strokeWidth="1.2"/>`,
      
  HeapsBadge: `<circle cx="45" cy="30" r="5" fill="#D4603A" stroke="#B84E2C" strokeWidth="1.8" />
      <circle cx="32" cy="45" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="58" cy="45" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="24" cy="60" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="40" cy="60" r="3" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.8"/>
      <circle cx="50" cy="60" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="66" cy="60" r="3" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 42 33 L 34 42 M 48 33 L 56 42 M 30 48 L 26 57 M 34 48 L 38 57 M 56 48 L 52 57 M 60 48 L 64 57" stroke="${defaultStroke}" strokeWidth="1.2"/>`,
      
  TriesBadge: `<circle cx="45" cy="25" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <circle cx="30" cy="40" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="45" cy="40" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="60" cy="40" r="3" fill="${highlightFill}" stroke="${highlightStroke}"/>
      <circle cx="25" cy="55" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="35" cy="55" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="55" cy="55" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="65" cy="55" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <path d="M 43 28 L 32 38 M 45 29 L 45 37 M 47 28 L 58 38 M 29 42 L 26 53 M 31 42 L 34 53 M 59 42 L 56 53 M 61 42 L 64 53" stroke="${defaultStroke}" strokeWidth="1"/>`,
      
  HashMapsBadge: `
      <rect x="25" y="38" width="12" height="14" rx="2" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <path d="M 39 45 L 47 45" stroke="#E5E0D8" strokeWidth="1.5" strokeDasharray="2 2" markerEnd="url(#arrow-hash)"/>
      <rect x="52" y="30" width="18" height="6" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="52" y="40" width="18" height="6" rx="1" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <rect x="52" y="50" width="18" height="6" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="52" y="60" width="18" height="6" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <defs>
        <marker id="arrow-hash" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#E5E0D8" />
        </marker>
      </defs>`,
      
  SlidingWindowBadge: `<rect x="18" y="40" width="54" height="10" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="26" y1="40" x2="26" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="34" y1="40" x2="34" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="42" y1="40" x2="42" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="50" y1="40" x2="50" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="58" y1="40" x2="58" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="66" y1="40" x2="66" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="34" y="38" width="24" height="14" fill="${highlightFill}" stroke="#D4603A" strokeWidth="1.8"/>
      <path d="M 34 33 L 34 36 M 34 33 L 38 33" stroke="#16A34A" strokeWidth="2"/>
      <path d="M 58 33 L 58 36 M 58 33 L 54 33" stroke="#EA580C" strokeWidth="2"/>`,
      
  TwoPointersBadge: `<line x1="20" y1="45" x2="70" y2="45" stroke="${defaultStroke}" strokeWidth="1.5"/>
      <circle cx="20" cy="45" r="2" fill="${defaultStroke}"/>
      <circle cx="45" cy="45" r="2" fill="${defaultStroke}"/>
      <circle cx="70" cy="45" r="2" fill="${defaultStroke}"/>
      <path d="M 30 38 L 38 45 L 30 52" fill="none" stroke="#16A34A" strokeWidth="2"/>
      <path d="M 60 38 L 52 45 L 60 52" fill="none" stroke="#EA580C" strokeWidth="2"/>
      <circle cx="45" cy="45" r="6" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>`,
      
  BinarySearchBadge: `<rect x="18" y="40" width="54" height="10" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="26" y1="40" x2="26" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="34" y1="40" x2="34" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="42" y1="40" x2="42" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="50" y1="40" x2="50" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="58" y1="40" x2="58" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="66" y1="40" x2="66" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="34" y="40" width="24" height="10" fill="${highlightFill}"/>
      <line x1="46" y1="30" x2="46" y2="60" stroke="#D4603A" strokeWidth="1.5" strokeDasharray="4 2"/>`,
      
  SortingBadge: `<rect x="25" y="55" width="6" height="5" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="35" y="48" width="6" height="12" rx="1" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <rect x="45" y="40" width="6" height="20" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="55" y="30" width="6" height="30" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <path d="M 22 45 L 60 30" stroke="#E5E0D8" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M 60 30 L 55 28 M 60 30 L 58 35" stroke="#E5E0D8" strokeWidth="1.5"/>`,
      
  SearchingBadge: `<circle cx="40" cy="40" r="12" fill="none" stroke="${defaultStroke}" strokeWidth="2"/>
      <line x1="48" y1="48" x2="58" y2="58" stroke="${defaultStroke}" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="36" cy="38" r="2" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1"/>
      <circle cx="44" cy="38" r="2" fill="${defaultStroke}" />
      <circle cx="40" cy="44" r="2" fill="${defaultStroke}" />
      <line x1="37" y1="38" x2="43" y2="38" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="37" y1="39" x2="40" y2="43" stroke="${defaultStroke}" strokeWidth="1"/>`,
      
  DPBadge: `<rect x="30" y="30" width="30" height="30" fill="none" stroke="${defaultStroke}" strokeWidth="1.5"/>
      <line x1="40" y1="30" x2="40" y2="60" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="50" y1="30" x2="50" y2="60" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="30" y1="40" x2="60" y2="40" stroke="${defaultStroke}" strokeWidth="1"/>
      <line x1="30" y1="50" x2="60" y2="50" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="50" y="50" width="10" height="10" fill="#D4603A" />
      <path d="M 32 32 L 48 48" stroke="#16A34A" strokeWidth="1.5" markerEnd="url(#arrow-dp)"/>
      <defs>
        <marker id="arrow-dp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#16A34A" />
        </marker>
      </defs>`,
      
  BacktrackingBadge: `<circle cx="45" cy="25" r="4" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1.2"/>
      <path d="M 43 28 L 32 38" stroke="${defaultStroke}" strokeWidth="1.2" strokeDasharray="2 2"/>
      <path d="M 47 28 L 58 38" stroke="#16A34A" strokeWidth="1.5"/>
      <circle cx="30" cy="40" r="3" fill="${defaultFill}" stroke="${defaultStroke}"/>
      <circle cx="60" cy="40" r="3" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <path d="M 28 42 L 24 50" stroke="${defaultStroke}" strokeWidth="1.2" strokeDasharray="2 2"/>
      <path d="M 58 42 L 52 50" stroke="${defaultStroke}" strokeWidth="1.2" strokeDasharray="2 2"/>
      <path d="M 62 42 L 68 50" stroke="#16A34A" strokeWidth="1.5"/>
      <path d="M 22 52 L 26 56 M 26 52 L 22 56" stroke="#D4603A" strokeWidth="1.2"/>
      <path d="M 50 52 L 54 56 M 54 52 L 50 56" stroke="#D4603A" strokeWidth="1.2"/>
      <path d="M 68 53 L 71 57 L 76 50" stroke="#16A34A" strokeWidth="1.5" fill="none"/>`,
      
  GreedyBadge: `<polyline points="20,60 35,60 35,45 50,45 50,30 65,30" fill="none" stroke="${defaultStroke}" strokeWidth="2"/>
      <circle cx="35" cy="60" r="4" fill="${highlightFill}" stroke="${highlightStroke}"/>
      <circle cx="50" cy="45" r="4" fill="${highlightFill}" stroke="${highlightStroke}"/>
      <circle cx="65" cy="30" r="4" fill="${highlightFill}" stroke="${highlightStroke}"/>`,
      
  PrefixSumBadge: `<rect x="25" y="50" width="6" height="10" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <rect x="35" y="42" width="6" height="18" rx="1" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <rect x="45" y="32" width="6" height="28" rx="1" fill="${highlightFill}" stroke="${highlightStroke}" strokeWidth="1.5"/>
      <rect x="55" y="20" width="6" height="40" rx="1" fill="${defaultFill}" stroke="${defaultStroke}" strokeWidth="1"/>
      <path d="M 38 65 L 38 68 L 48 68 L 48 65" fill="none" stroke="#D4603A" strokeWidth="1.2"/>
      <text x="43" y="76" fontSize="10" fill="#D4603A" textAnchor="middle" fontFamily="var(--font-dmsans)">Σ</text>`
};

for (const [name, content] of Object.entries(badges)) {
  const fileContent = "import React from 'react';\n\nexport default function " + name + "(props: React.SVGProps<SVGSVGElement>) {\n  const { className = '', ...rest } = props;\n  return (\n" + baseSvg(content) + "\n  );\n}\n";

  fs.writeFileSync(path.join(badgesDir, name + ".tsx"), fileContent);
  console.log("Generated " + name + ".tsx");
}
