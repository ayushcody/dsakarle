import React from 'react';

export default function IsometricCampus() {
  return (
    <svg viewBox="0 0 1200 600" className="w-full h-auto max-w-[900px] drop-shadow-2xl">
      {/* Isometric Projection Transform */}
      <g transform="translate(600, 150) scale(1, 0.5) rotate(45) scale(1.1)">
        {/* Base Grid / Ground */}
        <rect x="-250" y="-250" width="500" height="500" fill="#F0EDE8" stroke="#E5E0D8" strokeWidth="2" />
        
        {/* Connecting Paths */}
        <polyline points="-120,-120 -120,40 200,40 200,180" fill="none" stroke="#E5E0D8" strokeWidth="20" strokeLinecap="square"/>
        <polyline points="-120,-120 180,-120 180,-40" fill="none" stroke="#E5E0D8" strokeWidth="20" />

        {/* 7. Blue Pools */}
        <rect x="-220" y="-220" width="80" height="120" fill="#60B8D4" rx="4"/>
        <rect x="-200" y="100" width="60" height="100" fill="#60B8D4" rx="4"/>
        
        {/* 1. Main Building */}
        <g transform="translate(-100, -100)">
          {/* Base */}
          <rect x="0" y="0" width="200" height="200" fill="#FFFFFF" />
          <rect x="0" y="0" width="200" height="200" fill="none" stroke="#E5E0D8" strokeWidth="4" />
          {/* Inner courtyard */}
          <rect x="40" y="40" width="120" height="120" fill="#F0EDE8" />
          <rect x="40" y="40" width="120" height="120" fill="none" stroke="#E5E0D8" strokeWidth="2" />
          <text x="100" y="115" fontFamily="var(--font-dmsans)" fontSize="42" fontWeight="bold" fill="#C8900A" textAnchor="middle" transform="rotate(-45 100 100)">DSA</text>
        </g>
        
        {/* 2. Array Platform */}
        <g transform="translate(-200, -50)">
          <rect x="0" y="0" width="30" height="150" fill="#FAF9F7" stroke="#E5E0D8" strokeWidth="2" />
          {[0, 30, 60, 90, 120].map(y => (
            <rect key={y} x="5" y={y + 5} width="20" height="20" fill="#FFFFFF" stroke="#C8900A" strokeWidth="2" />
          ))}
        </g>
        
        {/* 3. Linked List Platform */}
        <g transform="translate(-100, 120)">
          <rect x="0" y="0" width="150" height="40" fill="#FAF9F7" stroke="#E5E0D8" strokeWidth="2" />
          {[10, 60, 110].map(x => (
            <circle key={x} cx={x + 15} cy="20" r="10" fill="#FFFFFF" stroke="#D4603A" strokeWidth="2" />
          ))}
          <line x1="40" y1="20" x2="60" y2="20" stroke="#D4603A" strokeWidth="2" />
          <line x1="90" y1="20" x2="110" y2="20" stroke="#D4603A" strokeWidth="2" />
        </g>
        
        {/* 4. Stack Platform */}
        <g transform="translate(150, 150)">
          <rect x="0" y="0" width="60" height="60" fill="#FAF9F7" stroke="#E5E0D8" strokeWidth="2" />
          <rect x="10" y="10" width="40" height="40" fill="#FFFFFF" stroke="#1D7A6B" strokeWidth="2" />
          <rect x="20" y="20" width="20" height="20" fill="#1D7A6B" opacity="0.3"/>
        </g>

        {/* 5. Graph Platform */}
        <g transform="translate(140, -200)">
          <rect x="0" y="0" width="80" height="80" fill="#FAF9F7" stroke="#E5E0D8" strokeWidth="2" />
          <circle cx="20" cy="20" r="8" fill="#FFFFFF" stroke="#C8900A" strokeWidth="2" />
          <circle cx="60" cy="20" r="8" fill="#FFFFFF" stroke="#C8900A" strokeWidth="2" />
          <circle cx="40" cy="60" r="8" fill="#FFFFFF" stroke="#C8900A" strokeWidth="2" />
          <line x1="20" y1="20" x2="60" y2="20" stroke="#C8900A" strokeWidth="2" />
          <line x1="20" y1="20" x2="40" y2="60" stroke="#C8900A" strokeWidth="2" />
          <line x1="60" y1="20" x2="40" y2="60" stroke="#C8900A" strokeWidth="2" />
        </g>

        {/* 6. Tree Platform */}
        <g transform="translate(140, -60)">
          <rect x="0" y="0" width="80" height="80" fill="#FAF9F7" stroke="#E5E0D8" strokeWidth="2" />
          <circle cx="40" cy="20" r="6" fill="#FFFFFF" stroke="#1D7A6B" strokeWidth="2" />
          <circle cx="20" cy="60" r="6" fill="#FFFFFF" stroke="#1D7A6B" strokeWidth="2" />
          <circle cx="60" cy="60" r="6" fill="#FFFFFF" stroke="#1D7A6B" strokeWidth="2" />
          <line x1="40" y1="26" x2="20" y2="54" stroke="#1D7A6B" strokeWidth="2" />
          <line x1="40" y1="26" x2="60" y2="54" stroke="#1D7A6B" strokeWidth="2" />
        </g>

        {/* 8. Green Pixel Trees */}
        {[
          [100, 100], [130, 80], [-180, -180], [-140, -200], [-50, 180]
        ].map(([tx, ty], i) => (
          <g key={i} transform={`translate(${tx}, ${ty})`}>
            <rect x="8" y="8" width="8" height="8" fill="#795548" />
            <rect x="0" y="0" width="24" height="24" fill="#5CB85C" />
          </g>
        ))}

        {/* 9. Amphitheatre */}
        <g transform="translate(200, 200)">
          <path d="M -50 -50 A 50 50 0 0 1 50 -50" fill="none" stroke="#E5E0D8" strokeWidth="6" />
          <path d="M -70 -50 A 70 70 0 0 1 70 -50" fill="none" stroke="#E5E0D8" strokeWidth="6" />
          <path d="M -90 -50 A 90 90 0 0 1 90 -50" fill="none" stroke="#E5E0D8" strokeWidth="6" />
        </g>
      </g>
    </svg>
  );
}
