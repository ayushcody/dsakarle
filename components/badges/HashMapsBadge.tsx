import React from 'react';

export default function HashMapsBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      
      <rect x="25" y="38" width="12" height="14" rx="2" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
      <path d="M 39 45 L 47 45" stroke="#E5E0D8" strokeWidth="1.5" strokeDasharray="2 2" markerEnd="url(#arrow-hash)"/>
      <rect x="52" y="30" width="18" height="6" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <rect x="52" y="40" width="18" height="6" rx="1" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
      <rect x="52" y="50" width="18" height="6" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <rect x="52" y="60" width="18" height="6" rx="1" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1"/>
      <defs>
        <marker id="arrow-hash" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#E5E0D8" />
        </marker>
      </defs>
    </svg>

  );
}
