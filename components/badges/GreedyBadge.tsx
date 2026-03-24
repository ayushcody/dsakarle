import React from 'react';

export default function GreedyBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <polyline points="20,60 35,60 35,45 50,45 50,30 65,30" fill="none" stroke="#C8900A" strokeWidth="2"/>
      <circle cx="35" cy="60" r="4" fill="rgba(200,144,10,0.35)" stroke="#C8900A"/>
      <circle cx="50" cy="45" r="4" fill="rgba(200,144,10,0.35)" stroke="#C8900A"/>
      <circle cx="65" cy="30" r="4" fill="rgba(200,144,10,0.35)" stroke="#C8900A"/>
    </svg>

  );
}
