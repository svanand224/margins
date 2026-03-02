'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Library,
  BarChart3,
  Target,
  Users,
  MessageSquare,
  Gift,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Search,
  Compass,
} from 'lucide-react';

interface TutorialStep {
  icon: typeof BookOpen;
  title: string;
  description: string;
  color: string;
}

const steps: TutorialStep[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Margins',
    description: 'Your personal reading companion. Track books, set goals, and connect with fellow readers. Let\'s take a quick tour!',
    color: 'var(--th-gold)',
  },
  {
    icon: Plus,
    title: 'Add Books',
    description: 'Search by title, look up by ISBN, paste an Amazon link, or enter details manually. Your library starts with one book!',
    color: 'var(--th-forest)',
  },
  {
    icon: Library,
    title: 'Your Library',
    description: 'All your books in one place. Filter by status — Currently Reading, Want to Read, Completed, or DNF. Sort by title, author, date, or rating.',
    color: 'var(--th-teal)',
  },
  {
    icon: BookOpen,
    title: 'Track Progress',
    description: 'On each book page, update your current page or log reading sessions. Sessions automatically advance your progress bar and track time spent.',
    color: 'var(--th-amber)',
  },
  {
    icon: Target,
    title: 'Set Goals',
    description: 'Challenge yourself with yearly book goals or daily page/minute targets. Watch your progress on the home page.',
    color: 'var(--th-copper)',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'See your reading patterns, genre breakdown, reading streaks, and more. Discover insights about your reading habits.',
    color: 'var(--th-plum)',
  },
  {
    icon: Compass,
    title: 'Discover & Explore',
    description: 'Browse trending books and find new reads on the Explore page. See what other readers are enjoying.',
    color: 'var(--th-rose)',
  },
  {
    icon: Gift,
    title: 'Recommendations',
    description: 'Send book recommendations to friends. After completing 5 books, unlock personalized "For You" suggestions based on your taste.',
    color: 'var(--th-forest)',
  },
  {
    icon: MessageSquare,
    title: 'Marginalia',
    description: 'Join or start discussion threads about books. Share thoughts with the community in notes-in-the-margins style conversations.',
    color: 'var(--th-gold)',
  },
  {
    icon: Users,
    title: 'Share Your Library',
    description: 'Make your profile public from Settings to share your bookshelf. Follow other readers, customize your accent color, and build your reading community.',
    color: 'var(--th-teal)',
  },
];

export default function OnboardingTutorial() {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeen = localStorage.getItem('margins-tutorial-seen');
    if (!hasSeen) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('margins-tutorial-seen', 'true');
    setShow(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-parchment rounded-2xl shadow-2xl w-full max-w-md border border-gold-light/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="h-1 bg-cream">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--th-gold), var(--th-amber))' }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full text-ink-muted/50 hover:text-ink hover:bg-cream/50 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}, color-mix(in srgb, ${step.color} 60%, transparent))`,
                    }}
                  >
                    <step.icon className="w-8 h-8 text-parchment" />
                  </motion.div>

                  {/* Title */}
                  <h2
                    className="text-xl font-bold text-ink mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {step.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step indicator dots */}
              <div className="flex justify-center gap-1.5 mt-6 mb-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className="transition-all"
                    style={{
                      width: i === currentStep ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: i === currentStep ? 'var(--th-gold)' : 'var(--th-gold-light)',
                      opacity: i === currentStep ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-parchment"
                  style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                >
                  {currentStep < steps.length - 1 ? (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <>Start Reading <Sparkles className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              {/* Skip hint */}
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleClose}
                  className="mt-3 text-xs text-ink-muted/50 hover:text-ink-muted transition-colors w-full text-center"
                >
                  Skip tutorial
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
