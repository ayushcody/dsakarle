import React from 'react';

export default function PrefixSumBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="25" y="50" width="6" height="10" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <rect x="35" y="42" width="6" height="18" rx="1" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
      <rect x="45" y="32" width="6" height="28" rx="1" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
      <rect x="55" y="20" width="6" height="40" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <path d="M 38 65 L 38 68 L 48 68 L 48 65" fill="none" stroke="#D4603A" strokeWidth="1.2"/>
      <text x="43" y="76" fontSize="10" fill="#D4603A" textAnchor="middle" fontFamily="var(--font-dmsans)">Σ</text>
    </svg>

  );
}
