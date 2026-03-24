import React from 'react';

export default function SortingBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="25" y="55" width="6" height="5" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <rect x="35" y="48" width="6" height="12" rx="1" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
      <rect x="45" y="40" width="6" height="20" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <rect x="55" y="30" width="6" height="30" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <path d="M 22 45 L 60 30" stroke="#E5E0D8" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M 60 30 L 55 28 M 60 30 L 58 35" stroke="#E5E0D8" strokeWidth="1.5"/>
    </svg>

  );
}
