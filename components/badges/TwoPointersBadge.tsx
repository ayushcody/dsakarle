import React from 'react';

export default function TwoPointersBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <line x1="20" y1="45" x2="70" y2="45" stroke="#C8900A" strokeWidth="1.5"/>
      <circle cx="20" cy="45" r="2" fill="#C8900A"/>
      <circle cx="45" cy="45" r="2" fill="#C8900A"/>
      <circle cx="70" cy="45" r="2" fill="#C8900A"/>
      <path d="M 30 38 L 38 45 L 30 52" fill="none" stroke="#16A34A" strokeWidth="2"/>
      <path d="M 60 38 L 52 45 L 60 52" fill="none" stroke="#EA580C" strokeWidth="2"/>
      <circle cx="45" cy="45" r="6" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.5"/>
    </svg>

  );
}
