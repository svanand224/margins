'use client';

export default function PomegranateLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main pomegranate body */}
      <ellipse cx="32" cy="35" rx="18" ry="20" fill="var(--th-bark)" />
      <ellipse cx="32" cy="35" rx="18" ry="20" fill="url(#pomGrad)" />

      {/* Inner highlight */}
      <ellipse cx="29" cy="30" rx="10" ry="12" fill="var(--th-copper)" opacity="0.35" />

      {/* Crown / calyx at top */}
      <path
        d="M28 16 C28 10, 32 7, 32 7 C32 7, 36 10, 36 16"
        stroke="var(--th-gold)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 17 C24 12, 28 8, 32 7 C36 8, 40 12, 39 17"
        stroke="var(--th-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Small crown leaf */}
      <ellipse cx="32" cy="10" rx="2.5" ry="4" fill="var(--th-gold)" opacity="0.7" />

      {/* Seeds visible through a cut section */}
      <path
        d="M32 24 C38 24, 44 30, 44 38 C44 44, 40 50, 32 52"
        fill="var(--th-rose)"
        opacity="0.25"
      />
      {/* Individual seeds / arils */}
      {[
        [35, 32], [38, 36], [34, 38], [38, 41], [36, 44],
        [33, 35], [31, 40], [34, 42], [37, 33], [32, 44],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={2.2}
          fill="var(--th-rose)"
          opacity={0.5 + (i % 3) * 0.15}
        />
      ))}

      {/* Subtle stem */}
      <line x1="32" y1="7" x2="32" y2="3" stroke="var(--th-gold-dark)" strokeWidth="1.5" strokeLinecap="round" />

      <defs>
        <radialGradient id="pomGrad" cx="0.4" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="var(--th-copper)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--th-bark)" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
