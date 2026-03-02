'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LocalClock() {
  const [time, setTime] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <motion.button
      onClick={() => setExpanded(!expanded)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream/90 backdrop-blur-md border border-gold-light/30 shadow-sm cursor-pointer select-none transition-colors hover:bg-cream"
    >
      {/* Tiny lotus clock icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
        <circle cx="7" cy="7" r="6" stroke="var(--th-gold)" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M7 3 C6 5, 5.8 6.5, 7 8.5 C8.2 6.5, 8 5, 7 3Z" fill="var(--th-gold)" opacity="0.5" />
        <path d="M7 8.5 C5.5 7, 4 5.5, 3.5 4 C4 6, 5.5 7.5, 7 8.5Z" fill="var(--th-gold)" opacity="0.3" />
        <path d="M7 8.5 C8.5 7, 10 5.5, 10.5 4 C10 6, 8.5 7.5, 7 8.5Z" fill="var(--th-gold)" opacity="0.3" />
      </svg>
      <span
        className="text-xs font-medium text-ink-muted tabular-nums"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        {time}
      </span>
      {expanded && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          className="text-[10px] text-ink-muted/70 overflow-hidden whitespace-nowrap"
        >
          {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </motion.span>
      )}
    </motion.button>
  );
}
