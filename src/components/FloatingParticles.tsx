'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Generates a minimalist lotus silhouette SVG path.
 * Varies between 3 styles: full lotus, single petal, and bud.
 */
function lotusFullPath(size: number) {
  const s = size;
  const cx = s / 2;
  const base = s * 0.85;
  const cp = `M${cx} ${s * 0.15} C${cx - s * 0.12} ${s * 0.45}, ${cx - s * 0.1} ${s * 0.65}, ${cx} ${base} C${cx + s * 0.1} ${s * 0.65}, ${cx + s * 0.12} ${s * 0.45}, ${cx} ${s * 0.15}Z`;
  const lp = `M${cx} ${base} C${cx - s * 0.2} ${s * 0.6}, ${cx - s * 0.35} ${s * 0.35}, ${cx - s * 0.28} ${s * 0.25} C${cx - s * 0.2} ${s * 0.45}, ${cx - s * 0.1} ${s * 0.65}, ${cx} ${base}Z`;
  const rp = `M${cx} ${base} C${cx + s * 0.2} ${s * 0.6}, ${cx + s * 0.35} ${s * 0.35}, ${cx + s * 0.28} ${s * 0.25} C${cx + s * 0.2} ${s * 0.45}, ${cx + s * 0.1} ${s * 0.65}, ${cx} ${base}Z`;
  return `${cp} ${lp} ${rp}`;
}

function lotusPetalPath(size: number) {
  const s = size;
  const cx = s / 2;
  return `M${cx} ${s * 0.1} C${cx - s * 0.2} ${s * 0.4}, ${cx - s * 0.18} ${s * 0.7}, ${cx} ${s * 0.9} C${cx + s * 0.18} ${s * 0.7}, ${cx + s * 0.2} ${s * 0.4}, ${cx} ${s * 0.1}Z`;
}

function lotusBudPath(size: number) {
  const s = size;
  const cx = s / 2;
  return `M${cx} ${s * 0.15} C${cx - s * 0.08} ${s * 0.35}, ${cx - s * 0.15} ${s * 0.6}, ${cx} ${s * 0.85} C${cx + s * 0.15} ${s * 0.6}, ${cx + s * 0.08} ${s * 0.35}, ${cx} ${s * 0.15}Z`;
}

const pathFns = [lotusFullPath, lotusPetalPath, lotusBudPath];

export default function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 14 + 8,
      duration: Math.random() * 14 + 12,
      delay: Math.random() * 8,
      tx: (Math.random() - 0.5) * 50,
      ty: -(Math.random() * 50 + 10),
      rotate: (Math.random() - 0.5) * 40,
      variant: i % 3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, p.ty, 0],
            x: [0, p.tx, 0],
            opacity: [0, 0.45, 0.2, 0.45, 0],
            scale: [0.8, 1, 0.8],
            rotate: [p.rotate, p.rotate + 15, p.rotate - 15, p.rotate],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox={`0 0 ${p.size} ${p.size}`} width={p.size} height={p.size}>
            <path
              d={pathFns[p.variant](p.size)}
              fill="var(--th-particle-inner)"
              stroke="var(--th-particle-outer)"
              strokeWidth="0.4"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
