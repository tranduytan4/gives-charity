import type { SVGProps } from 'react';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 540 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gives Charity Logo"
      className={className}
      {...props}
    >
      <title>Gives Charity Logo</title>
      <defs>
        {/* Heart icon gradient from royal blue to cyan */}
        <linearGradient id="logoHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" /> {/* blue-700 */}
          <stop offset="40%" stopColor="#2563EB" /> {/* blue-600 */}
          <stop offset="100%" stopColor="#06B6D4" /> {/* cyan-500 */}
        </linearGradient>

        {/* Text Gives gradient */}
        <linearGradient id="logoTextGivesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Glow filter for the sparkle */}
        <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stylized Heart Icon on the Left */}
      <g transform="translate(15, 10)">
        {/* Tilted Heart Base */}
        <path
          d="M 50 88 C 50 88 15 63 15 35 C 15 18 28 8 42 8 C 50 8 57 13 62 20 C 67 13 74 8 82 8 C 96 8 109 18 109 35 C 109 54 94 72 80 82 L 50 88 Z"
          fill="url(#logoHeartGrad)"
          transform="rotate(-12, 62, 48)"
        />

        {/* White circular eye/handshake shape inside heart */}
        <circle cx="66" cy="30" r="13" fill="white" transform="rotate(-12, 62, 48)" />

        {/* Blue inner center pupil/cutout */}
        <circle cx="66" cy="30" r="7.5" fill="#1D4ED8" transform="rotate(-12, 62, 48)" />

        {/* White curved wing cut detail */}
        <path
          d="M 75 28 C 82 28 89 35 89 43 C 89 46 87 49 85 51 C 87 48 88 45 88 42 C 88 36 82 31 75 31 Z"
          fill="white"
          transform="rotate(-12, 62, 48)"
        />

        {/* Soft cyan highlight reflection arc in the heart */}
        <path
          d="M 23 35 C 23 23 33 13 45 13"
          stroke="#22D3EE"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          transform="rotate(-12, 62, 48)"
        />
      </g>

      {/* Gives text in dark navy */}
      <text
        x="135"
        y="90"
        fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
        fontWeight="800"
        fontSize="64"
        fill="#1E3A8A"
        letterSpacing="-2"
      >
        Gives
      </text>

      {/* Charity text */}
      <text
        x="320"
        y="90"
        fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
        fontWeight="800"
        fontSize="64"
        fill="url(#logoTextGivesGrad)"
        letterSpacing="-2"
      >
        Charity
      </text>

      {/* Cyan sparkle replacing the dot of the i */}
      {/* Positioned precisely above the dotless i (around x = 364, y = 32) */}
      <g transform="translate(354, 20)" filter="url(#sparkleGlow)">
        {/* Sparkle star points */}
        <path d="M 12 0 L 15 9 L 24 12 L 15 15 L 12 24 L 9 15 L 0 12 L 9 9 Z" fill="#22D3EE" />
        {/* Sparkle center bright core */}
        <circle cx="12" cy="12" r="3" fill="white" />
      </g>
    </svg>
  );
}
