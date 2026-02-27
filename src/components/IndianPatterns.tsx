'use client';

/**
 * IndianPatterns — Tasteful, dainty decorative SVG elements inspired by
 * Indian textile art: paisley, mehndi borders, lotus motifs, and chintz florals.
 * Uses theme CSS variables for day/night compatibility.
 */

/** Paisley corner ornament — place in card corners for subtle cultural flair */
export function PaisleyCorner({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* Main paisley teardrop */}
      <path
        d="M60 8C52 8 40 16 36 28C32 40 36 56 48 64C48 64 56 56 60 44C64 32 64 16 60 8Z"
        stroke="var(--th-gold)"
        strokeWidth="1"
        fill="var(--th-gold)"
        fillOpacity="0.04"
        strokeLinecap="round"
      />
      {/* Inner curl */}
      <path
        d="M56 16C52 20 46 28 46 38C46 46 50 54 52 58"
        stroke="var(--th-gold)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Decorative dots along the spine */}
      {[20, 28, 36, 44, 52].map((y, i) => (
        <circle key={i} cx={50 - i * 1.5} cy={y} r="1" fill="var(--th-gold)" opacity={0.15 + i * 0.05} />
      ))}
      {/* Tiny leaf flourish */}
      <path
        d="M36 28C32 24 26 22 20 24C26 26 30 28 34 30"
        stroke="var(--th-amber)"
        strokeWidth="0.7"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mehndi-inspired horizontal divider */
export function MehndiDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Center lotus bud */}
      <path
        d="M200 4C196 8 194 14 200 20C206 14 204 8 200 4Z"
        stroke="var(--th-gold)"
        strokeWidth="0.8"
        fill="var(--th-gold)"
        fillOpacity="0.06"
      />
      <path
        d="M200 20C194 16 188 12 186 8C188 12 192 16 200 20Z"
        stroke="var(--th-gold)"
        strokeWidth="0.7"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M200 20C206 16 212 12 214 8C212 12 208 16 200 20Z"
        stroke="var(--th-gold)"
        strokeWidth="0.7"
        fill="none"
        opacity="0.3"
      />

      {/* Left vine with leaves */}
      <path
        d="M180 12C160 12 140 10 120 12C100 14 80 12 60 12C40 12 20 14 0 12"
        stroke="var(--th-gold)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.2"
        strokeLinecap="round"
      />
      {[40, 80, 120, 160].map((x, i) => (
        <g key={`left-${i}`} opacity={0.15 + (3 - i) * 0.03}>
          <path
            d={`M${x} 12C${x - 4} ${9 - i % 2 * 2} ${x - 8} ${8 - i % 2 * 2} ${x - 10} ${10 - i % 2}`}
            stroke="var(--th-gold)"
            strokeWidth="0.6"
            fill="none"
          />
          <circle cx={x} cy="12" r="0.8" fill="var(--th-gold)" opacity="0.3" />
        </g>
      ))}

      {/* Right vine with leaves */}
      <path
        d="M220 12C240 12 260 10 280 12C300 14 320 12 340 12C360 12 380 14 400 12"
        stroke="var(--th-gold)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.2"
        strokeLinecap="round"
      />
      {[240, 280, 320, 360].map((x, i) => (
        <g key={`right-${i}`} opacity={0.15 + (3 - i) * 0.03}>
          <path
            d={`M${x} 12C${x + 4} ${9 - i % 2 * 2} ${x + 8} ${8 - i % 2 * 2} ${x + 10} ${10 - i % 2}`}
            stroke="var(--th-gold)"
            strokeWidth="0.6"
            fill="none"
          />
          <circle cx={x} cy="12" r="0.8" fill="var(--th-gold)" opacity="0.3" />
        </g>
      ))}

      {/* Dot accents near center */}
      {[-16, -10, 10, 16].map((offset) => (
        <circle key={offset} cx={200 + offset} cy="12" r="0.6" fill="var(--th-gold)" opacity="0.25" />
      ))}
    </svg>
  );
}

/** Chintz-inspired floral motif — subtle background accent */
export function ChintzFloral({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central flower */}
      <circle cx="30" cy="30" r="3" fill="var(--th-gold)" fillOpacity="0.06" stroke="var(--th-gold)" strokeWidth="0.5" opacity="0.3" />
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d="M30 30C28 24 26 18 30 14C34 18 32 24 30 30Z"
          stroke="var(--th-gold)"
          strokeWidth="0.5"
          fill="var(--th-gold)"
          fillOpacity="0.03"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.25"
        />
      ))}
      {/* Outer dot ring */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 30 + 20 * Math.cos(rad);
        const y = 30 + 20 * Math.sin(rad);
        return <circle key={angle} cx={x} cy={y} r="0.7" fill="var(--th-gold)" opacity="0.12" />;
      })}
    </svg>
  );
}

/** Elephant silhouette — very subtle watermark style */
export function ElephantWatermark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Elephant body */}
      <path
        d="M30 50C30 36 38 24 52 22C64 20 76 24 84 32C90 38 94 46 94 56V70C94 74 92 78 88 78H82V68H72V78H62V68H52V78H46C42 78 40 74 40 70V62C36 60 30 56 30 50Z"
        stroke="var(--th-gold)"
        strokeWidth="0.8"
        fill="var(--th-gold)"
        fillOpacity="0.03"
        strokeLinejoin="round"
        opacity="0.2"
      />
      {/* Trunk */}
      <path
        d="M30 50C26 52 22 56 18 62C16 66 14 70 16 72"
        stroke="var(--th-gold)"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Ear */}
      <path
        d="M42 32C36 34 32 40 34 46"
        stroke="var(--th-gold)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.15"
      />
      {/* Eye */}
      <circle cx="46" cy="34" r="1.2" fill="var(--th-gold)" opacity="0.15" />
      {/* Decorative blanket */}
      <path
        d="M56 30C56 30 62 28 70 30C78 32 84 36 86 42"
        stroke="var(--th-gold)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.12"
      />
      <path
        d="M54 38C54 38 62 36 72 38C80 40 86 44 88 50"
        stroke="var(--th-gold)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.1"
      />
      {/* Blanket dots */}
      {[60, 68, 76].map((x, i) => (
        <circle key={i} cx={x} cy={34 + i} r="0.8" fill="var(--th-gold)" opacity="0.1" />
      ))}
      {/* Palace on top */}
      <path
        d="M62 22V16L64 12L66 16V22"
        stroke="var(--th-gold)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.12"
      />
      <path
        d="M58 22V18H70V22"
        stroke="var(--th-gold)"
        strokeWidth="0.4"
        fill="none"
        opacity="0.1"
      />
    </svg>
  );
}

/** Mandala corner decoration */
export function MandalaCorner({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Quarter mandala for corner use */}
      <path
        d="M0 0 Q25 0 50 0 Q50 25 50 50"
        stroke="var(--th-gold)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.1"
      />
      <path
        d="M0 0 Q20 5 40 0 Q45 20 50 40"
        stroke="var(--th-gold)"
        strokeWidth="0.4"
        fill="none"
        opacity="0.08"
      />
      {/* Radiating arcs */}
      {[10, 20, 30, 40].map((r, i) => (
        <path
          key={i}
          d={`M0 ${r} Q${r / 2} ${r / 2} ${r} 0`}
          stroke="var(--th-gold)"
          strokeWidth="0.4"
          fill="none"
          opacity={0.06 + i * 0.02}
        />
      ))}
      {/* Dot accents */}
      {[8, 16, 24, 32].map((pos, i) => (
        <circle key={i} cx={pos * 0.7} cy={pos * 0.7} r="0.6" fill="var(--th-gold)" opacity={0.08 + i * 0.03} />
      ))}
    </svg>
  );
}

/** Inline paisley border pattern — repeating horizontal strip */
export function PaisleyBorder({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full ${className}`}
      preserveAspectRatio="none"
    >
      {[0, 40, 80, 120, 160].map((x, i) => (
        <g key={i} opacity={0.12 + (i % 2) * 0.04}>
          <path
            d={`M${x + 20} 2C${x + 16} 4 ${x + 12} 8 ${x + 14} 12C${x + 16} 14 ${x + 20} 14 ${x + 24} 12C${x + 28} 8 ${x + 24} 4 ${x + 20} 2Z`}
            stroke="var(--th-gold)"
            strokeWidth="0.5"
            fill="var(--th-gold)"
            fillOpacity="0.03"
          />
          <path
            d={`M${x + 20} 5C${x + 18} 7 ${x + 17} 9 ${x + 18} 11`}
            stroke="var(--th-gold)"
            strokeWidth="0.4"
            fill="none"
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}

/** Full lotus flower divider — elegant horizontal separator */
export function LotusDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Center lotus - 3 petal style like MehndiDivider */}
      <g transform="translate(200, 25)">
        {/* Center petal */}
        <path
          d="M0 -16C-4 -8 -4 4 0 12C4 4 4 -8 0 -16Z"
          stroke="var(--th-gold)"
          strokeWidth="1"
          fill="var(--th-gold)"
          fillOpacity="0.15"
        />
        {/* Left petal */}
        <path
          d="M0 12C-6 6 -14 2 -16 -4C-14 2 -8 8 0 12Z"
          stroke="var(--th-gold)"
          strokeWidth="0.8"
          fill="none"
          opacity="0.5"
        />
        {/* Right petal */}
        <path
          d="M0 12C6 6 14 2 16 -4C14 2 8 8 0 12Z"
          stroke="var(--th-gold)"
          strokeWidth="0.8"
          fill="none"
          opacity="0.5"
        />
      </g>
      
      {/* Decorative flowing vines left */}
      <path
        d="M150 25C130 23 110 27 90 25C70 23 50 27 30 25C10 23 0 25 0 25"
        stroke="var(--th-gold)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Left leaves */}
      {[120, 80, 40].map((x, i) => (
        <g key={`l-${i}`}>
          <path
            d={`M${x} 25C${x - 8} ${20 - i} ${x - 14} ${22 - i} ${x - 16} 25C${x - 14} ${28 + i} ${x - 8} ${30 + i} ${x} 25Z`}
            stroke="var(--th-gold)"
            strokeWidth="1"
            fill="var(--th-gold)"
            fillOpacity="0.2"
            opacity={0.6 - i * 0.1}
          />
        </g>
      ))}
      
      {/* Decorative flowing vines right */}
      <path
        d="M250 25C270 23 290 27 310 25C330 23 350 27 370 25C390 23 400 25 400 25"
        stroke="var(--th-gold)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Right leaves */}
      {[280, 320, 360].map((x, i) => (
        <g key={`r-${i}`}>
          <path
            d={`M${x} 25C${x + 8} ${20 - i} ${x + 14} ${22 - i} ${x + 16} 25C${x + 14} ${28 + i} ${x + 8} ${30 + i} ${x} 25Z`}
            stroke="var(--th-gold)"
            strokeWidth="1"
            fill="var(--th-gold)"
            fillOpacity="0.2"
            opacity={0.6 - i * 0.1}
          />
        </g>
      ))}
      
      {/* Small decorative curls */}
      <path d="M160 22C165 18 170 18 172 22" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M240 22C235 18 230 18 228 22" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.4" />
    </svg>
  );
}

/** Lotus icon matching the logo style - line art with teardrop petals */
export function LotusIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Center petal */}
      <path
        d="M12 4C10 8 10 12 12 16C14 12 14 8 12 4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.1"
        strokeLinejoin="round"
      />
      {/* Left petal */}
      <path
        d="M12 16C9 13 5 11 4 8C5 11 8 14 12 16Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
        strokeLinejoin="round"
      />
      {/* Right petal */}
      <path
        d="M12 16C15 13 19 11 20 8C19 11 16 14 12 16Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
        strokeLinejoin="round"
      />
      {/* Inner detail */}
      <path
        d="M12 8C11 10 11 12 12 14C13 12 13 10 12 8Z"
        stroke="currentColor"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

/** Peacock feather motif — iconic Indian design element */
export function PeacockFeather({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Feather shaft */}
      <path
        d="M30 120C30 100 29 80 30 60C31 40 30 20 30 0"
        stroke="var(--th-gold)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      
      {/* Eye of the feather */}
      <ellipse cx="30" cy="35" rx="18" ry="24" stroke="var(--th-gold)" strokeWidth="1.5" fill="var(--th-gold)" fillOpacity="0.15" opacity="0.7" />
      <ellipse cx="30" cy="35" rx="12" ry="16" stroke="var(--th-amber)" strokeWidth="1.2" fill="var(--th-amber)" fillOpacity="0.2" opacity="0.65" />
      <ellipse cx="30" cy="35" rx="6" ry="9" stroke="var(--th-gold)" strokeWidth="1" fill="var(--th-gold)" fillOpacity="0.3" opacity="0.7" />
      
      {/* Central eye dot */}
      <circle cx="30" cy="33" r="3" fill="var(--th-gold)" fillOpacity="0.5" />
      <circle cx="30" cy="33" r="1.5" fill="var(--th-gold)" fillOpacity="0.7" />
      
      {/* Feather barbs */}
      {[...Array(12)].map((_, i) => {
        const y = 65 + i * 4;
        const spread = 10 + i * 0.8;
        return (
          <g key={i} opacity={0.5 - i * 0.025}>
            <path d={`M30 ${y}L${30 - spread} ${y + 3}`} stroke="var(--th-gold)" strokeWidth="0.8" />
            <path d={`M30 ${y}L${30 + spread} ${y + 3}`} stroke="var(--th-gold)" strokeWidth="0.8" />
          </g>
        );
      })}
      
      {/* Decorative dots around the eye */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 30 + 15 * Math.cos(rad);
        const y = 35 + 20 * Math.sin(rad);
        return <circle key={angle} cx={x} cy={y} r="1.5" fill="var(--th-gold)" opacity="0.5" />;
      })}
    </svg>
  );
}

/** Rangoli-inspired pattern — traditional Indian floor art */
export function RangoliPattern({ className = '', size = 100 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
    >
      {/* Outer circles */}
      <circle cx="50" cy="50" r="45" stroke="var(--th-gold)" strokeWidth="1.2" fill="none" opacity="0.5" />
      <circle cx="50" cy="50" r="40" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.4" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="35" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.45" />
      
      {/* Inner geometric pattern */}
      <circle cx="50" cy="50" r="25" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.4" />
      <circle cx="50" cy="50" r="15" stroke="var(--th-gold)" strokeWidth="1" fill="var(--th-gold)" fillOpacity="0.12" opacity="0.5" />
      <circle cx="50" cy="50" r="5" fill="var(--th-gold)" fillOpacity="0.35" />
      
      {/* Petal shapes radiating out */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <path
            d="M50 20C46 28 46 36 50 42C54 36 54 28 50 20Z"
            stroke="var(--th-gold)"
            strokeWidth="1"
            fill="var(--th-gold)"
            fillOpacity="0.2"
            opacity="0.6"
          />
          <circle cx="50" cy="17" r="2" fill="var(--th-gold)" opacity="0.5" />
        </g>
      ))}
      
      {/* Diamond shapes */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <path
            d="M50 8L53 14L50 20L47 14Z"
            stroke="var(--th-gold)"
            strokeWidth="0.8"
            fill="var(--th-gold)"
            fillOpacity="0.15"
            opacity="0.5"
          />
        </g>
      ))}
      
      {/* Dot accents */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return <circle key={angle} cx={50 + 38 * Math.cos(rad)} cy={50 + 38 * Math.sin(rad)} r="2" fill="var(--th-gold)" opacity="0.5" />;
      })}
    </svg>
  );
}

/** Diya (oil lamp) motif — symbol of light and knowledge */
export function DiyaLamp({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Flame */}
      <path
        d="M30 8C26 14 25 20 28 24C29 26 30 27 30 28C30 27 31 26 32 24C35 20 34 14 30 8Z"
        stroke="var(--th-amber)"
        strokeWidth="1.5"
        fill="var(--th-amber)"
        fillOpacity="0.4"
        opacity="0.9"
      />
      <path
        d="M30 12C28 15 27 18 29 21C30 22 30 23 30 23C30 23 30 22 31 21C33 18 32 15 30 12Z"
        stroke="var(--th-gold)"
        strokeWidth="1"
        fill="var(--th-gold)"
        fillOpacity="0.5"
        opacity="0.95"
      />
      
      {/* Lamp bowl */}
      <path
        d="M20 35C20 30 24 28 30 28C36 28 40 30 40 35C40 42 36 48 30 48C24 48 20 42 20 35Z"
        stroke="var(--th-gold)"
        strokeWidth="1.5"
        fill="var(--th-gold)"
        fillOpacity="0.2"
        opacity="0.8"
      />
      
      {/* Oil in lamp */}
      <ellipse cx="30" cy="36" rx="8" ry="3" fill="var(--th-gold)" fillOpacity="0.25" opacity="0.7" />
      
      {/* Lamp base */}
      <path
        d="M24 48C24 48 22 52 22 56C22 60 26 64 30 64C34 64 38 60 38 56C38 52 36 48 36 48"
        stroke="var(--th-gold)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.15"
        opacity="0.7"
      />
      
      {/* Decorative rings */}
      <ellipse cx="30" cy="48" rx="6" ry="1.5" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <ellipse cx="30" cy="58" rx="5" ry="1.2" stroke="var(--th-gold)" strokeWidth="0.8" fill="none" opacity="0.5" />
      
      {/* Light rays */}
      {[-30, -15, 0, 15, 30].map((angle) => (
        <path
          key={angle}
          d="M30 6L30 2"
          stroke="var(--th-amber)"
          strokeWidth="1"
          opacity="0.6"
          transform={`rotate(${angle} 30 15)`}
        />
      ))}
    </svg>
  );
}

/** Jali pattern — Mughal geometric screen/lattice design */
export function JaliPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Geometric star pattern */}
      <g opacity="0.2">
        {/* Central octagon */}
        <path
          d="M50 20L65 35L65 65L50 80L35 65L35 35Z"
          stroke="var(--th-gold)"
          strokeWidth="0.6"
          fill="var(--th-gold)"
          fillOpacity="0.04"
        />
        
        {/* Inner star */}
        <path
          d="M50 30L58 42L50 50L42 42Z"
          stroke="var(--th-gold)"
          strokeWidth="0.5"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M50 50L58 58L50 70L42 58Z"
          stroke="var(--th-gold)"
          strokeWidth="0.5"
          fill="none"
          opacity="0.8"
        />
        
        {/* Corner patterns */}
        {[
          { x: 20, y: 20 },
          { x: 80, y: 20 },
          { x: 20, y: 80 },
          { x: 80, y: 80 }
        ].map((pos, i) => (
          <g key={i}>
            <path
              d={`M${pos.x} ${pos.y}L${pos.x + (pos.x < 50 ? 15 : -15)} ${pos.y}L${pos.x} ${pos.y + (pos.y < 50 ? 15 : -15)}Z`}
              stroke="var(--th-gold)"
              strokeWidth="0.4"
              fill="var(--th-gold)"
              fillOpacity="0.03"
            />
          </g>
        ))}
        
        {/* Connecting lines */}
        <path d="M20 50L35 50" stroke="var(--th-gold)" strokeWidth="0.4" />
        <path d="M65 50L80 50" stroke="var(--th-gold)" strokeWidth="0.4" />
        <path d="M50 20L50 35" stroke="var(--th-gold)" strokeWidth="0.4" />
        <path d="M50 65L50 80" stroke="var(--th-gold)" strokeWidth="0.4" />
        
        {/* Diagonal connections */}
        <path d="M35 35L25 25" stroke="var(--th-gold)" strokeWidth="0.3" opacity="0.6" />
        <path d="M65 35L75 25" stroke="var(--th-gold)" strokeWidth="0.3" opacity="0.6" />
        <path d="M35 65L25 75" stroke="var(--th-gold)" strokeWidth="0.3" opacity="0.6" />
        <path d="M65 65L75 75" stroke="var(--th-gold)" strokeWidth="0.3" opacity="0.6" />
      </g>
      
      {/* Decorative dots at intersections */}
      {[
        { x: 50, y: 20 }, { x: 50, y: 80 }, { x: 20, y: 50 }, { x: 80, y: 50 },
        { x: 35, y: 35 }, { x: 65, y: 35 }, { x: 35, y: 65 }, { x: 65, y: 65 }
      ].map((pos, i) => (
        <circle key={i} cx={pos.x} cy={pos.y} r="1.2" fill="var(--th-gold)" opacity="0.15" />
      ))}
    </svg>
  );
}

/** Ornate decorative frame — for cards and sections */
export function OrnateFrame({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {/* Corner ornaments */}
      <svg className="absolute top-0 left-0 w-12 h-12 -translate-x-1 -translate-y-1" viewBox="0 0 50 50" fill="none">
        <path d="M5 5C5 5 5 20 5 35C5 40 10 45 15 45L45 45" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M10 5C10 5 10 18 10 30C10 35 14 38 18 38L45 38" stroke="var(--th-gold)" strokeWidth="0.6" fill="none" opacity="0.15" />
        <circle cx="5" cy="5" r="2" fill="var(--th-gold)" opacity="0.3" />
        <path d="M5 12C8 12 12 12 12 16" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" opacity="0.2" />
      </svg>
      
      <svg className="absolute top-0 right-0 w-12 h-12 translate-x-1 -translate-y-1" viewBox="0 0 50 50" fill="none">
        <path d="M45 5C45 5 45 20 45 35C45 40 40 45 35 45L5 45" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M40 5C40 5 40 18 40 30C40 35 36 38 32 38L5 38" stroke="var(--th-gold)" strokeWidth="0.6" fill="none" opacity="0.15" />
        <circle cx="45" cy="5" r="2" fill="var(--th-gold)" opacity="0.3" />
        <path d="M45 12C42 12 38 12 38 16" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" opacity="0.2" />
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-12 h-12 -translate-x-1 translate-y-1" viewBox="0 0 50 50" fill="none">
        <path d="M5 45C5 45 5 30 5 15C5 10 10 5 15 5L45 5" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M10 45C10 45 10 32 10 20C10 15 14 12 18 12L45 12" stroke="var(--th-gold)" strokeWidth="0.6" fill="none" opacity="0.15" />
        <circle cx="5" cy="45" r="2" fill="var(--th-gold)" opacity="0.3" />
        <path d="M5 38C8 38 12 38 12 34" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" opacity="0.2" />
      </svg>
      
      <svg className="absolute bottom-0 right-0 w-12 h-12 translate-x-1 translate-y-1" viewBox="0 0 50 50" fill="none">
        <path d="M45 45C45 45 45 30 45 15C45 10 40 5 35 5L5 5" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M40 45C40 45 40 32 40 20C40 15 36 12 32 12L5 12" stroke="var(--th-gold)" strokeWidth="0.6" fill="none" opacity="0.15" />
        <circle cx="45" cy="45" r="2" fill="var(--th-gold)" opacity="0.3" />
        <path d="M45 38C42 38 38 38 38 34" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" opacity="0.2" />
      </svg>
      
      {children}
    </div>
  );
}

/** Block print border — inspired by traditional Indian textile printing */
export function BlockPrintBorder({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Repeating lotus block print motifs */}
      {[...Array(16)].map((_, i) => {
        const x = i * 25 + 12.5;
        const isAlt = i % 2 === 0;
        // Alternate between gold and amber/copper for visual interest
        const color = i % 4 < 2 ? 'var(--th-gold)' : 'var(--th-amber)';
        return (
          <g key={i}>
            {isAlt ? (
              // 3-petal lotus motif (smaller)
              <>
                {/* Center petal */}
                <path
                  d={`M${x} 7C${x - 2} 9.5 ${x - 2} 14 ${x} 17C${x + 2} 14 ${x + 2} 9.5 ${x} 7Z`}
                  fill={color}
                  fillOpacity="0.5"
                  stroke={color}
                  strokeWidth="0.6"
                />
                {/* Left petal */}
                <path
                  d={`M${x} 17C${x - 3} 14 ${x - 6} 12 ${x - 7} 9C${x - 6} 11.5 ${x - 4} 14 ${x} 17Z`}
                  stroke={color}
                  strokeWidth="0.6"
                  fill="none"
                  opacity="0.7"
                />
                {/* Right petal */}
                <path
                  d={`M${x} 17C${x + 3} 14 ${x + 6} 12 ${x + 7} 9C${x + 6} 11.5 ${x + 4} 14 ${x} 17Z`}
                  stroke={color}
                  strokeWidth="0.6"
                  fill="none"
                  opacity="0.7"
                />
              </>
            ) : (
              // Three dots
              <>
                <circle cx={x} cy="12" r="1.2" fill={color} fillOpacity="0.7" />
                <circle cx={x - 4} cy="12" r="0.8" fill={color} fillOpacity="0.5" />
                <circle cx={x + 4} cy="12" r="0.8" fill={color} fillOpacity="0.5" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Mehendi hand pattern — detailed henna-inspired decoration */
export function MehendiHand({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g opacity="0.25">
        {/* Palm outline */}
        <path
          d="M25 70C20 65 18 55 20 45C22 35 28 28 35 25C42 22 50 24 55 30C60 36 62 45 60 55C58 65 52 75 45 82C38 89 28 90 25 85V70Z"
          stroke="var(--th-gold)"
          strokeWidth="0.8"
          fill="var(--th-gold)"
          fillOpacity="0.03"
        />
        
        {/* Finger patterns */}
        <path d="M30 25L28 10" stroke="var(--th-gold)" strokeWidth="0.6" />
        <path d="M38 22L38 6" stroke="var(--th-gold)" strokeWidth="0.6" />
        <path d="M46 22L48 8" stroke="var(--th-gold)" strokeWidth="0.6" />
        <path d="M53 28L58 15" stroke="var(--th-gold)" strokeWidth="0.6" />
        
        {/* Central mandala on palm */}
        <circle cx="40" cy="50" r="10" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" />
        <circle cx="40" cy="50" r="6" stroke="var(--th-gold)" strokeWidth="0.4" fill="none" />
        <circle cx="40" cy="50" r="2" fill="var(--th-gold)" opacity="0.3" />
        
        {/* Petal shapes around central circle */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <path
            key={angle}
            d="M40 50C38 44 38 40 40 36C42 40 42 44 40 50Z"
            stroke="var(--th-gold)"
            strokeWidth="0.4"
            fill="none"
            transform={`rotate(${angle} 40 50)`}
            opacity="0.8"
          />
        ))}
        
        {/* Wrist patterns */}
        <path d="M22 85C22 85 30 88 40 88C50 88 55 85 55 85" stroke="var(--th-gold)" strokeWidth="0.5" fill="none" />
        <path d="M24 92C24 92 32 95 40 95C48 95 54 92 54 92" stroke="var(--th-gold)" strokeWidth="0.4" fill="none" />
        <path d="M26 99C26 99 34 102 40 102C46 102 52 99 52 99" stroke="var(--th-gold)" strokeWidth="0.3" fill="none" />
        
        {/* Dot decorations */}
        {[
          { x: 30, y: 35 }, { x: 50, y: 35 }, { x: 40, y: 65 },
          { x: 28, y: 55 }, { x: 52, y: 55 }
        ].map((pos, i) => (
          <circle key={i} cx={pos.x} cy={pos.y} r="1" fill="var(--th-gold)" opacity="0.3" />
        ))}
        
        {/* Fingertip decorations */}
        {[
          { x: 28, y: 10 }, { x: 38, y: 6 }, { x: 48, y: 8 }, { x: 58, y: 15 }
        ].map((pos, i) => (
          <circle key={i} cx={pos.x} cy={pos.y} r="2" stroke="var(--th-gold)" strokeWidth="0.4" fill="none" />
        ))}
      </g>
    </svg>
  );
}

/** Kolam dot pattern — South Indian traditional design base */
export function KolamDots({ className = '', rows = 5 }: { className?: string; rows?: number }) {
  const dots: { x: number; y: number }[] = [];
  const spacing = 12;
  
  for (let row = 0; row < rows; row++) {
    const cols = rows - Math.abs(row - Math.floor(rows / 2));
    const offsetX = (rows - cols) * spacing / 2;
    for (let col = 0; col < cols; col++) {
      dots.push({
        x: offsetX + col * spacing + spacing,
        y: row * spacing * 0.866 + spacing
      });
    }
  }
  
  const width = rows * spacing + spacing * 2;
  const height = rows * spacing * 0.866 + spacing * 2;
  
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: width * 1.5, height: height * 1.5 }}
    >
      {dots.map((dot, i) => (
        <g key={i}>
          <circle cx={dot.x} cy={dot.y} r="1.5" fill="var(--th-gold)" opacity="0.2" />
          <circle cx={dot.x} cy={dot.y} r="3" stroke="var(--th-gold)" strokeWidth="0.3" fill="none" opacity="0.1" />
        </g>
      ))}
      
      {/* Connecting curves */}
      {dots.length > 1 && (
        <path
          d={dots.slice(0, -1).map((dot, i) => {
            const next = dots[i + 1];
            if (!next) return '';
            const midX = (dot.x + next.x) / 2;
            const midY = (dot.y + next.y) / 2 - 3;
            return `M${dot.x},${dot.y} Q${midX},${midY} ${next.x},${next.y}`;
          }).join(' ')}
          stroke="var(--th-gold)"
          strokeWidth="0.4"
          fill="none"
          opacity="0.15"
        />
      )}
    </svg>
  );
}

/** Lotus Progress Bar — A progress bar where a lotus blooms as progress increases */
export function LotusProgressBar({ 
  progress, 
  className = '',
  barClassName = '',
  showPercentage = false,
  size = 'md'
}: { 
  progress: number; 
  className?: string;
  barClassName?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const p = Math.max(0, Math.min(1, progress / 100)); // Normalize to 0-1
  const barHeight = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
  const lotusSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Progress track */}
      <div className={`flex-1 bg-cream rounded-full overflow-hidden ${barHeight}`}>
        <div 
          className={`h-full bg-gradient-to-r from-gold via-amber to-copper rounded-full transition-all duration-500 ease-out ${barClassName}`}
          style={{ width: `${p * 100}%` }}
        />
      </div>
      
      {/* Blooming lotus */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="text-gold flex-shrink-0"
        style={{ width: lotusSize, height: lotusSize }}
      >
        {/* Center petal - always visible, grows with progress */}
        <path
          d={`M12 ${6 + (1 - p) * 3}C${10.5 - p * 1} 9 ${10.5 - p * 1} 13 12 ${17 + p * 1}C${13.5 + p * 1} 13 ${13.5 + p * 1} 9 12 ${6 + (1 - p) * 3}Z`}
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          fillOpacity={0.15 + p * 0.25}
          strokeLinejoin="round"
        />
        
        {/* Left inner petal - appears at 20% */}
        {p > 0.2 && (
          <path
            d={`M12 ${17 + p * 1}C${10 - (p - 0.2) * 4} 14 ${7 - (p - 0.2) * 4} 11 ${5 - (p - 0.2) * 2} 8C${6 - (p - 0.2) * 2} 11 ${9 - (p - 0.2) * 3} 14 12 ${17 + p * 1}Z`}
            stroke="currentColor"
            strokeWidth="1"
            fill="currentColor"
            fillOpacity={0.08 + (p - 0.2) * 0.15}
            strokeLinejoin="round"
            opacity={Math.min(1, (p - 0.2) * 2)}
          />
        )}
        
        {/* Right inner petal - appears at 20% */}
        {p > 0.2 && (
          <path
            d={`M12 ${17 + p * 1}C${14 + (p - 0.2) * 4} 14 ${17 + (p - 0.2) * 4} 11 ${19 + (p - 0.2) * 2} 8C${18 + (p - 0.2) * 2} 11 ${15 + (p - 0.2) * 3} 14 12 ${17 + p * 1}Z`}
            stroke="currentColor"
            strokeWidth="1"
            fill="currentColor"
            fillOpacity={0.08 + (p - 0.2) * 0.15}
            strokeLinejoin="round"
            opacity={Math.min(1, (p - 0.2) * 2)}
          />
        )}
        
        {/* Left outer petal - appears at 50% */}
        {p > 0.5 && (
          <path
            d={`M12 ${17 + p * 1}C${8 - (p - 0.5) * 6} 15 ${3 - (p - 0.5) * 4} 12 ${1 - (p - 0.5) * 2} 9C${2 - (p - 0.5) * 2} 12 ${7 - (p - 0.5) * 5} 15 12 ${17 + p * 1}Z`}
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            opacity={(p - 0.5) * 1.5}
            strokeLinejoin="round"
          />
        )}
        
        {/* Right outer petal - appears at 50% */}
        {p > 0.5 && (
          <path
            d={`M12 ${17 + p * 1}C${16 + (p - 0.5) * 6} 15 ${21 + (p - 0.5) * 4} 12 ${23 + (p - 0.5) * 2} 9C${22 + (p - 0.5) * 2} 12 ${17 + (p - 0.5) * 5} 15 12 ${17 + p * 1}Z`}
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            opacity={(p - 0.5) * 1.5}
            strokeLinejoin="round"
          />
        )}
        
        {/* Decorative stem dots - appear at 75% */}
        {p > 0.75 && [0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="12"
            cy={20 + i * 1.5}
            r="0.7"
            fill="currentColor"
            opacity={(p - 0.75) * 2 * (0.5 - i * 0.1)}
          />
        ))}
      </svg>
      
      {/* Optional percentage */}
      {showPercentage && (
        <span className="text-sm font-medium text-gold-dark min-w-[3rem] text-right">
          {Math.round(p * 100)}%
        </span>
      )}
    </div>
  );
}
