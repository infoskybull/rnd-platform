import React from "react";

interface RnDLogoProps {
  className?: string;
  size?: number;
}

const RnDLogo: React.FC<RnDLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer hexagon ring */}
      <path
        d="M50 5 L85 25 L85 65 L50 85 L15 65 L15 25 Z"
        stroke="url(#gradient1)"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />

      {/* Inner hexagon */}
      <path
        d="M50 15 L75 30 L75 60 L50 75 L25 60 L25 30 Z"
        fill="url(#gradient2)"
        opacity="0.8"
      />

      {/* R&D Text */}
      <text
        x="50"
        y="55"
        fontSize="28"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        R&D
      </text>

      {/* Game controller cross */}
      <g opacity="0.9">
        {/* Vertical line of cross */}
        <rect
          x="47"
          y="62"
          width="6"
          height="14"
          fill="url(#gradient3)"
          rx="2"
        />
        {/* Horizontal line of cross */}
        <rect
          x="41"
          y="68"
          width="18"
          height="6"
          fill="url(#gradient3)"
          rx="2"
        />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>

        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default RnDLogo;
