'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-rose" />
        </div>
        <h2
          className="text-2xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Something went wrong
        </h2>
        <p className="text-sm text-ink-muted mb-6">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-parchment"
            style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </motion.button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
