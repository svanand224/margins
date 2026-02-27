'use client';

/**
 * Lotus logo inspired by minimalist line-art lotus tattoo.
 * Delicate petals, dotted ornamental accents, diamond above.
 * All colors use theme CSS variables for day/night compatibility.
 */
export default function LotusLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top ornamental dots and diamond */}
      <circle cx="32" cy="6" r="1.2" fill="var(--th-ink)" opacity="0.6" />
      <rect
        x="32" y="10"
        width="3.5" height="3.5"
        transform="rotate(45 32 11.75)"
        stroke="var(--th-ink)"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      <circle cx="32" cy="17" r="0.8" fill="var(--th-ink)" opacity="0.5" />

      {/* Dotted line above lotus */}
      {[19.5, 21, 22.5].map((y, i) => (
        <circle key={`dot-top-${i}`} cx="32" cy={y} r="0.5" fill="var(--th-ink)" opacity={0.3 + i * 0.1} />
      ))}

      {/* === Lotus flower === */}
      {/* Center petal (tallest) */}
      <path
        d="M32 25 C28 34, 27 40, 32 48 C37 40, 36 34, 32 25Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.3"
        fill="var(--th-gold)"
        fillOpacity="0.08"
        strokeLinejoin="round"
      />

      {/* Inner teardrop detail */}
      <path
        d="M32 32 C30.5 36, 30 39, 32 42 C34 39, 33.5 36, 32 32Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />

      {/* Inner left petal */}
      <path
        d="M32 48 C27 42, 22 36, 22 30 C22 34, 25 42, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.06"
        strokeLinejoin="round"
      />

      {/* Inner right petal */}
      <path
        d="M32 48 C37 42, 42 36, 42 30 C42 34, 39 42, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.06"
        strokeLinejoin="round"
      />

      {/* Outer left petal */}
      <path
        d="M32 48 C24 44, 16 38, 14 32 C15 37, 21 44, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.04"
        strokeLinejoin="round"
      />

      {/* Outer right petal */}
      <path
        d="M32 48 C40 44, 48 38, 50 32 C49 37, 43 44, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.04"
        strokeLinejoin="round"
      />

      {/* Far outer left petal (widest) */}
      <path
        d="M32 48 C22 46, 10 40, 8 34 C10 39, 18 46, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.1"
        fill="none"
        opacity="0.6"
        strokeLinejoin="round"
      />

      {/* Far outer right petal (widest) */}
      <path
        d="M32 48 C42 46, 54 40, 56 34 C54 39, 46 46, 32 48Z"
        stroke="var(--th-gold-dark)"
        strokeWidth="1.1"
        fill="none"
        opacity="0.6"
        strokeLinejoin="round"
      />

      {/* Bottom diamond ornament */}
      <rect
        x="32" y="51"
        width="3" height="3"
        transform="rotate(45 32 52.5)"
        stroke="var(--th-gold-dark)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />

      {/* Dotted line below lotus */}
      {[56, 57.5, 59, 60.5, 62].map((y, i) => (
        <circle key={`dot-bot-${i}`} cx="32" cy={y} r="0.5" fill="var(--th-ink)" opacity={0.4 - i * 0.05} />
      ))}
    </svg>
  );
}
