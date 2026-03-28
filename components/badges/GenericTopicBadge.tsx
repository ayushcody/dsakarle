import React from 'react';

export default function GenericTopicBadge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 90 90" width={90} height={90} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="27" y="27" width="36" height="36" rx="10" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.4" />
      <path d="M 35 45 L 43 53 L 57 37" fill="none" stroke="#D4603A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
