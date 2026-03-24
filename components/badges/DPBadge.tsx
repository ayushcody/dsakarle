import React from 'react';

export default function DPBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="30" y="30" width="30" height="30" fill="none" stroke="#C8900A" strokeWidth="1.5"/>
      <line x1="40" y1="30" x2="40" y2="60" stroke="#C8900A" strokeWidth="1"/>
      <line x1="50" y1="30" x2="50" y2="60" stroke="#C8900A" strokeWidth="1"/>
      <line x1="30" y1="40" x2="60" y2="40" stroke="#C8900A" strokeWidth="1"/>
      <line x1="30" y1="50" x2="60" y2="50" stroke="#C8900A" strokeWidth="1"/>
      <rect x="50" y="50" width="10" height="10" fill="#D4603A" />
      <path d="M 32 32 L 48 48" stroke="#16A34A" strokeWidth="1.5" markerEnd="url(#arrow-dp)"/>
      <defs>
        <marker id="arrow-dp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#16A34A" />
        </marker>
      </defs>
    </svg>

  );
}
