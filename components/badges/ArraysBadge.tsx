import React from 'react';

export default function ArraysBadge(props: React.SVGProps<SVGSVGElement>) {
  const { className = '' } = props;
  return (

    <svg viewBox="0 0 90 90" width={90} height={90} className={className} {...props}>
      <circle cx="45" cy="45" r="42" fill="none" stroke="#E5E0D8" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="#E5E0D8" strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="23" y="40" width="8" height="10" rx="2" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <rect x="35" y="40" width="8" height="10" rx="2" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
      <rect x="47" y="40" width="8" height="10" rx="2" fill="rgba(200,144,10,0.35)" stroke="#C8900A" strokeWidth="1.8"/>
      <rect x="59" y="40" width="8" height="10" rx="2" fill="rgba(200,144,10,0.12)" stroke="#C8900A" strokeWidth="1.2"/>
    </svg>

  );
}
