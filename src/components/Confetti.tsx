'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { useThemeStore } from '@/lib/themeStore';

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

// Indian-inspired palettes — saffron, turmeric, marigold, sindoor, mehendi, peacock
const DAY_COLORS = [
  '#C0752A', // turmeric / haldi
  '#E07830', // saffron / kesar
  '#C25858', // sindoor red
  '#D4A034', // marigold gold
  '#4A6B3A', // mehendi green
  '#C48DA0', // lotus pink
  '#7A5C3A', // sandalwood
  '#8A5878', // jamun plum
];

const NIGHT_COLORS = [
  '#D4A034', // marigold gold
  '#94B1C8', // moonlit blue
  '#E07830', // diya flame
  '#9B3050', // deep sindoor
  '#6A9A80', // peacock green
  '#E3DFCE', // jasmine white
  '#B8D0E0', // light steel
  '#C48070', // terracotta
];

const SHAPES = ['lotus', 'petal', 'diya', 'dot', 'rangoli'] as const;

/** Lotus flower top-down silhouette — 5 petals radiating from center */
function lotusPath(size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const petalLength = size * 0.42;
  const petalWidth = size * 0.18;
  let d = '';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const tipX = cx + Math.cos(angle) * petalLength;
    const tipY = cy + Math.sin(angle) * petalLength;
    const perpAngle = angle + Math.PI / 2;
    const cp1X = cx + Math.cos(angle) * petalLength * 0.4 + Math.cos(perpAngle) * petalWidth;
    const cp1Y = cy + Math.sin(angle) * petalLength * 0.4 + Math.sin(perpAngle) * petalWidth;
    const cp2X = cx + Math.cos(angle) * petalLength * 0.4 - Math.cos(perpAngle) * petalWidth;
    const cp2Y = cy + Math.sin(angle) * petalLength * 0.4 - Math.sin(perpAngle) * petalWidth;
    d += `M${cx},${cy} C${cp1X},${cp1Y} ${cp1X},${cp1Y} ${tipX},${tipY} C${cp2X},${cp2Y} ${cp2X},${cp2Y} ${cx},${cy} `;
  }
  return d;
}

/** Single teardrop petal */
function petalPath(size: number) {
  const cx = size / 2;
  return `M${cx} ${size * 0.05} C${cx - size * 0.25} ${size * 0.35}, ${cx - size * 0.2} ${size * 0.7}, ${cx} ${size * 0.95} C${cx + size * 0.2} ${size * 0.7}, ${cx + size * 0.25} ${size * 0.35}, ${cx} ${size * 0.05}Z`;
}

/** Diya flame shape */
function diyaPath(size: number) {
  const cx = size / 2;
  return `M${cx} ${size * 0.05} C${cx - size * 0.15} ${size * 0.3}, ${cx - size * 0.3} ${size * 0.6}, ${cx} ${size * 0.95} C${cx + size * 0.3} ${size * 0.6}, ${cx + size * 0.15} ${size * 0.3}, ${cx} ${size * 0.05}Z`;
}

/** Simple 4-point rangoli diamond */
function rangoliPath(size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const ri = r * 0.35;
  let d = '';
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i - Math.PI / 4;
    const nextAngle = (Math.PI / 2) * (i + 0.5) - Math.PI / 4;
    const ox = cx + Math.cos(angle) * r;
    const oy = cy + Math.sin(angle) * r;
    const ix = cx + Math.cos(nextAngle) * ri;
    const iy = cy + Math.sin(nextAngle) * ri;
    d += `${i === 0 ? 'M' : 'L'}${ox},${oy} L${ix},${iy} `;
  }
  return d + 'Z';
}

export default function Confetti({ show, onComplete }: ConfettiProps) {
  const [visible, setVisible] = useState(false);
  const { theme } = useThemeStore();
  const colors = theme === 'night' ? NIGHT_COLORS : DAY_COLORS;

  const pieces = useMemo(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[i % colors.length],
      shape: SHAPES[i % SHAPES.length],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 200,
      fall: Math.random() * 400 + 600,
      spin: Math.random() * 720 - 360,
      duration: Math.random() * 2 + 2.5,
    })), [colors]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{ left: `${p.x}%`, top: -20 }}
              initial={{ opacity: 1, y: -20, x: 0, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0.8, 0],
                y: p.fall,
                x: p.drift,
                rotate: p.spin,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {p.shape === 'lotus' ? (
                <svg width={p.size + 2} height={p.size + 2} viewBox={`0 0 ${p.size + 2} ${p.size + 2}`}>
                  <path d={lotusPath(p.size + 2)} fill={p.color} opacity="0.75" />
                </svg>
              ) : p.shape === 'petal' ? (
                <svg width={p.size + 2} height={p.size + 2} viewBox={`0 0 ${p.size + 2} ${p.size + 2}`}>
                  <path d={petalPath(p.size + 2)} fill={p.color} opacity="0.7" />
                </svg>
              ) : p.shape === 'diya' ? (
                <svg width={p.size + 2} height={p.size + 2} viewBox={`0 0 ${p.size + 2} ${p.size + 2}`}>
                  <path d={diyaPath(p.size + 2)} fill={p.color} opacity="0.7" />
                </svg>
              ) : p.shape === 'rangoli' ? (
                <svg width={p.size + 2} height={p.size + 2} viewBox={`0 0 ${p.size + 2} ${p.size + 2}`}>
                  <path d={rangoliPath(p.size + 2)} fill={p.color} opacity="0.65" />
                </svg>
              ) : (
                <div
                  style={{
                    width: p.size * 0.4,
                    height: p.size * 0.4,
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    opacity: 0.6,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
