import React from 'react';

export default function SearchingBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="40" cy="40" r="12" fill="none" stroke="#C8900A" strokeWidth="2"/>
      <line x1="48" y1="48" x2="58" y2="58" stroke="#C8900A" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="36" cy="38" r="2" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1"/>
      <circle cx="44" cy="38" r="2" fill="#C8900A" />
      <circle cx="40" cy="44" r="2" fill="#C8900A" />
      <line x1="37" y1="38" x2="43" y2="38" stroke="#C8900A" strokeWidth="1"/>
      <line x1="37" y1="39" x2="40" y2="43" stroke="#C8900A" strokeWidth="1"/>
    </svg>

  );
}
