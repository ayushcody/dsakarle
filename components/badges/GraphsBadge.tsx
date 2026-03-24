import React from 'react';

export default function GraphsBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="45" cy="28" r="5" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.8"/>
      <circle cx="28" cy="40" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="62" cy="40" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="35" cy="62" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="55" cy="62" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <path d="M 42 32 L 31 38 M 48 32 L 59 38 M 31 43 L 34 58 M 59 43 L 56 58 M 38 62 L 51 62" stroke="#C8900A" strokeWidth="1.2"/>
    </svg>

  );
}
