'use client';

import Navigation from '@/components/Navigation';
import FloatingParticles from '@/components/FloatingParticles';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import PageTutorial from '@/components/PageTutorial';
import LocalClock from '@/components/LocalClock';
import NotificationSummary from '@/components/NotificationSummary';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

/** Lotus-shaped scroll-to-top button */
function LotusScrollButton() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {showScroll && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-gold/90 to-amber/90 shadow-lg shadow-gold/30 flex items-center justify-center backdrop-blur-sm border border-gold-light/30"
          aria-label="Scroll to top"
        >
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
            {/* Lotus petals pointing up */}
            <path
              d="M16 6C14 10 13 14 16 20C19 14 18 10 16 6Z"
              stroke="white"
              strokeWidth="1.2"
              fill="white"
              fillOpacity="0.2"
              strokeLinejoin="round"
            />
            <path
              d="M16 20C12 16 8 12 7 9C9 12 12 16 16 20Z"
              stroke="white"
              strokeWidth="1"
              fill="white"
              fillOpacity="0.15"
              strokeLinejoin="round"
            />
            <path
              d="M16 20C20 16 24 12 25 9C23 12 20 16 16 20Z"
              stroke="white"
              strokeWidth="1"
              fill="white"
              fillOpacity="0.15"
              strokeLinejoin="round"
            />
            <path
              d="M16 20C10 18 5 14 3 11C6 14 11 17 16 20Z"
              stroke="white"
              strokeWidth="0.8"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M16 20C22 18 27 14 29 11C26 14 21 17 16 20Z"
              stroke="white"
              strokeWidth="0.8"
              fill="none"
              opacity="0.6"
            />
            {/* Small up arrow at top */}
            <path
              d="M16 4L14 7H18L16 4Z"
              fill="white"
              opacity="0.8"
            />
            {/* Decorative dots */}
            <circle cx="16" cy="23" r="0.8" fill="white" opacity="0.5" />
            <circle cx="16" cy="25.5" r="0.6" fill="white" opacity="0.3" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Unauthenticated users see only the page content (login) with no app chrome
  if (!loading && !user) {
    return (
      <main className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <>
      <FloatingParticles />
      <Navigation />
      {user && <OnboardingTutorial />}
      {user && <LocalClock />}
      {user && <NotificationSummary />}
      <main className="md:ml-20 lg:ml-64 pb-24 md:pb-8 relative z-10 min-h-screen">
        {user && <PageTutorial pathname={pathname} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <LotusScrollButton />
    </>
  );
}
