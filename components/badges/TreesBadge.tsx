import React from 'react';

export default function TreesBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="45" cy="30" r="5" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.8"/>
      <path d="M 41 33 L 33 42" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 49 33 L 57 42" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="30" cy="45" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="60" cy="45" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 28 48 L 22 56" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 32 48 L 38 56" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 58 48 L 52 56" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 62 48 L 68 56" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="20" cy="58" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="40" cy="58" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="50" cy="58" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="70" cy="58" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
    </svg>

  );
}
