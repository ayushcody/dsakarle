import React from 'react';

export default function TriesBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="45" cy="25" r="4" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <circle cx="30" cy="40" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <circle cx="45" cy="40" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <circle cx="60" cy="40" r="3" fill="rgba(200,144,10,0.35)" stroke="#C8900A"/>
      <circle cx="25" cy="55" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <circle cx="35" cy="55" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <circle cx="55" cy="55" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <circle cx="65" cy="55" r="3" fill="rgba(200,144,10,0.12)" stroke="#C8900A"/>
      <path d="M 43 28 L 32 38 M 45 29 L 45 37 M 47 28 L 58 38 M 29 42 L 26 53 M 31 42 L 34 53 M 59 42 L 56 53 M 61 42 L 64 53" stroke="#C8900A" strokeWidth="1"/>
    </svg>

  );
}
