import React from 'react';

export default function StacksQueuesBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="35" y="52" width="20" height="6" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <rect x="37" y="44" width="16" height="6" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <rect x="39" y="36" width="12" height="6" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.8"/>
      <path d="M 56 39 L 64 39" stroke="#C8900A" strokeWidth="1.5" markerEnd="url(#arrow)"/>
    </svg>

  );
}
