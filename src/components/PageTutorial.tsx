'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';

interface PageTip {
  id: string;
  title: string;
  tips: string[];
}

const pageTips: Record<string, PageTip> = {
  '/': {
    id: 'home',
    title: 'Welcome to Margins',
    tips: [
      'Track your reading with daily sessions — just tap a book and log pages',
      'Organize books into threads to create curated collections',
      'Mark your top 3 books as gold recommendations to share with others',
      'Check your Today\'s Reading card for a quick snapshot of your day',
      'Use the navigation to explore your library, goals, analytics, and more',
    ],
  },
  '/library': {
    id: 'library',
    title: 'Library Tips',
    tips: [
      'Use threads to group books into collections — by mood, theme, genre, or anything',
      'Search by title, author, genre, or tag — including thread names',
      'Filter by reading status or genre to find books quickly',
      'Tap the heart icon to mark favorites',
      'Switch between grid and list views',
    ],
  },
  '/goals': {
    id: 'goals',
    title: 'Goals Tips',
    tips: [
      'Set yearly book goals or daily page/minute targets',
      'Reading sessions automatically update your daily progress',
      'Unlock achievements by reading more and exploring genres',
      'Edit goal targets anytime by clicking the pencil icon',
    ],
  },
  '/analytics': {
    id: 'analytics',
    title: 'Analytics Tips',
    tips: [
      'View your reading patterns over weeks, months, or years',
      'The heatmap shows your daily reading activity at a glance',
      'Genre breakdown reveals your reading diversity',
      'All data updates automatically as you log sessions',
    ],
  },
  '/discussions': {
    id: 'discussions',
    title: 'Marginalia Tips',
    tips: [
      'Create discussion threads about books or reading topics',
      'Link discussions to specific books for focused conversation',
      'Join discussions to start posting — anyone can read public threads',
      'Choose an accent color to personalize your thread',
      'Invite other readers by sharing the discussion',
    ],
  },
  '/recommendations': {
    id: 'recommendations',
    title: 'Recommendations Tips',
    tips: [
      'Send book recommendations to any reader on Margins',
      'Complete 5 books to unlock personalized "For You" suggestions',
      'Accept recommendations to add books directly to your TBR',
      'Share your latest completed reads with your network',
    ],
  },
  '/discover': {
    id: 'discover',
    title: 'Explore Tips',
    tips: [
      'Browse public libraries of other readers',
      'Featured readers are the most active this week',
      'Follow readers to see their activity in your feed',
      'See what others are reading and recently finished',
      'Search for readers by name or username',
    ],
  },
  '/notifications': {
    id: 'notifications',
    title: 'Notifications Tips',
    tips: [
      'Get notified when someone follows you',
      'Receive alerts when someone recommends a book to you',
      'See when readers join your Marginalia discussions',
      'Tap a notification to go to the related page',
      'Mark all as read to clear your notification badge',
    ],
  },
  '/profile': {
    id: 'profile',
    title: 'Profile Tips',
    tips: [
      'Make your library public to share with friends',
      'Customize your accent color and what visitors can see',
      'Set a custom URL slug for your shareable profile link',
      'Upload an avatar to personalize your profile',
      'Even private profiles can share a library link and follow others',
    ],
  },
  '/add': {
    id: 'add',
    title: 'Add Books Tips',
    tips: [
      'Search by title for the fastest way to add books',
      'Paste an Amazon link to auto-import book details',
      'Use ISBN lookup for exact editions',
      'Manual entry works for any book not in our database',
    ],
  },
};

export default function PageTutorial({ pathname }: { pathname: string }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Strip trailing slash and match
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const tip = pageTips[cleanPath];

  useEffect(() => {
    if (!tip) return;
    const key = `margins-page-tip-${tip.id}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [tip]);

  const handleDismiss = () => {
    if (tip) {
      localStorage.setItem(`margins-page-tip-${tip.id}`, 'true');
    }
    setDismissed(true);
    setTimeout(() => setShow(false), 300);
  };

  if (!tip || !show) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="mx-4 mt-4 md:mx-8 md:max-w-2xl md:mx-auto"
        >
          <div
            className="glass-card rounded-xl p-4 border"
            style={{ borderColor: 'color-mix(in srgb, var(--th-gold) 30%, transparent)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))' }}
              >
                <Lightbulb className="w-4 h-4 text-parchment" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-semibold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {tip.title}
                  </h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full text-ink-muted/40 hover:text-ink-muted hover:bg-cream/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="space-y-1">
                  {tip.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                      <span className="text-gold mt-0.5 flex-shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
