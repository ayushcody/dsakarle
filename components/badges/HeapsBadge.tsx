import React from 'react';

export default function HeapsBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="45" cy="30" r="5" fill="#D4603A" stroke="#B84E2C" strokeWidth="1.8" />
      <circle cx="32" cy="45" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="58" cy="45" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="24" cy="60" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="40" cy="60" r="3" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.8"/>
      <circle cx="50" cy="60" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="66" cy="60" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 42 33 L 34 42 M 48 33 L 56 42 M 30 48 L 26 57 M 34 48 L 38 57 M 56 48 L 52 57 M 60 48 L 64 57" stroke="#C8900A" strokeWidth="1.2"/>
    </svg>

  );
}
