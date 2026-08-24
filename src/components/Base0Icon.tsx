import React from "react";

interface Base0IconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const Base0Icon: React.FC<Base0IconProps> = ({ size = 32, className = "", glow = true }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="base0Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <filter id="base0Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer badge */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill="#09090b"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Geometric Orbit / 0 Ring */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="url(#base0Grad)"
          strokeWidth="8"
          strokeLinecap="round"
          filter={glow ? "url(#base0Glow)" : undefined}
        />

        {/* Inner Apex dot */}
        <circle cx="50" cy="20" r="4.5" fill="#38bdf8" />
        
        {/* Core '0' text */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1px"
        >
          0
        </text>
      </svg>
    </div>
  );
};
