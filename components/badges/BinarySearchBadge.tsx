import React from 'react';

export default function BinarySearchBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="18" y="40" width="54" height="10" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <line x1="26" y1="40" x2="26" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <line x1="34" y1="40" x2="34" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <line x1="42" y1="40" x2="42" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <line x1="50" y1="40" x2="50" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <line x1="58" y1="40" x2="58" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <line x1="66" y1="40" x2="66" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <rect x="34" y="40" width="24" height="10" fill="rgba(200,144,10,0.35)"/>
      <line x1="46" y1="30" x2="46" y2="60" stroke="#D4603A" strokeWidth="1.5" strokeDasharray="4 2"/>
    </svg>

  );
}
