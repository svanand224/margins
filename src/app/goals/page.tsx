'use client';

import { useBookStore } from '@/lib/store';
import { ReadingGoal } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  FileText,
  Calendar,
  Trophy,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { isThisYear, isThisMonth, format, startOfYear, differenceInDays } from 'date-fns';
import { MehndiDivider, LotusDivider, BlockPrintBorder, LotusProgressBar } from '@/components/IndianPatterns';

const goalTypeConfig = {
  'books-per-year': { icon: BookOpen, label: 'Books per Year', unit: 'books', color: 'from-gold/10 to-amber/10', iconColor: 'text-gold-dark' },
  'books-per-month': { icon: Calendar, label: 'Books per Month', unit: 'books', color: 'from-teal/10 to-teal-light/10', iconColor: 'text-teal' },
  'pages-per-day': { icon: FileText, label: 'Pages per Day', unit: 'pages', color: 'from-forest/10 to-sage-light/10', iconColor: 'text-forest' },
  'minutes-per-day': { icon: Clock, label: 'Minutes per Day', unit: 'min', color: 'from-copper/10 to-rose-light/10', iconColor: 'text-copper' },
};

// SVG achievement badge icons
function AchievementIcon({ type, className = '' }: { type: string; className?: string }) {
  switch (type) {
    case 'lotus':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 4C10 8 9 12 12 18C15 12 14 8 12 4Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
          <path d="M12 18C9 14 6 11 4 9C6 12 9 15 12 18Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M12 18C15 14 18 11 20 9C18 12 15 15 12 18Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      );
    case 'worm':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M5 16C7 12 10 10 12 12C14 14 17 12 19 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="19" cy="8" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
          <circle cx="18.2" cy="7.5" r="0.5" fill="currentColor" />
        </svg>
      );
    case 'cap':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 4L2 10L12 16L22 10L12 4Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" />
          <path d="M6 12.5V17.5C6 17.5 9 20 12 20C15 20 18 17.5 18 17.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="10" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'stack':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="4" y="14" width="16" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" />
          <rect x="5" y="10" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" />
          <rect x="6" y="6" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M4 16L2 7L7 11L12 5L17 11L22 7L20 16H4Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
          <rect x="4" y="16" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
          <polygon points="12,6 14,11 12,14 10,11" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8" />
          <polygon points="12,18 10,13 12,10 14,13" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 3L14.5 9L21 9.5L16 14L17.5 21L12 17.5L6.5 21L8 14L3 9.5L9.5 9Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
        </svg>
      );
    case 'pages':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="6" y="3" width="12" height="18" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08" />
          <line x1="9" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="9" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'flame':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 2C12 2 8 8 8 13C8 16.3 9.8 19 12 20C14.2 19 16 16.3 16 13C16 8 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
          <path d="M12 20C11 18.5 10 16.5 10.5 14.5C11 13 12 12 12 12C12 12 13 13 13.5 14.5C14 16.5 13 18.5 12 20Z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 20C12 20 4 14 4 9C4 6 6 4 8.5 4C10 4 11.5 5 12 6.5C12.5 5 14 4 15.5 4C18 4 20 6 20 9C20 14 12 20 12 20Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
        </svg>
      );
    case 'journal':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08" />
          <line x1="5" y1="3" x2="5" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="9" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'library':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="5" width="4" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <rect x="8" y="3" width="4" height="16" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <rect x="13" y="6" width="4" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M18 8L21 5V18L18 21V8Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
        </svg>
      );
    default:
      return <Trophy className={className} />;
  }
}

export default function GoalsPage() {
  const { goals, books, dailyLogs, addGoal, updateGoal, deleteGoal } = useBookStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState('');
  const [newGoalType, setNewGoalType] = useState<ReadingGoal['type']>('books-per-year');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const currentYear = new Date().getFullYear();

  const goalProgress = useMemo(() => {
    return goals.map(goal => {
      const config = goalTypeConfig[goal.type];
      let current = 0;
      let target = goal.target;

      switch (goal.type) {
        case 'books-per-year': {
          current = books.filter(b => b.status === 'completed' && b.finishDate && isThisYear(new Date(b.finishDate))).length;
          break;
        }
        case 'books-per-month': {
          current = books.filter(b => b.status === 'completed' && b.finishDate && isThisMonth(new Date(b.finishDate))).length;
          break;
        }
        case 'pages-per-day': {
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayLog = dailyLogs.find(l => l.date === today);
          current = todayLog?.pagesRead || 0;
          break;
        }
        case 'minutes-per-day': {
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayLog = dailyLogs.find(l => l.date === today);
          current = todayLog?.minutesSpent || 0;
          break;
        }
      }

      const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
      const isComplete = current >= target;

      // Pace calculation for yearly goals
      let paceInfo = '';
      if (goal.type === 'books-per-year') {
        const daysIntoYear = differenceInDays(new Date(), startOfYear(new Date())) + 1;
        const expectedPace = Math.round((goal.target / 365) * daysIntoYear);
        if (current >= expectedPace) {
          paceInfo = `Ahead of pace by ${current - expectedPace} book${current - expectedPace !== 1 ? 's' : ''}!`;
        } else {
          paceInfo = `${expectedPace - current} book${expectedPace - current !== 1 ? 's' : ''} behind pace`;
        }
      }

      return { goal, config, current, target, percentage, isComplete, paceInfo };
    });
  }, [goals, books, dailyLogs]);

  const handleAddGoal = () => {
    const target = parseInt(newGoalTarget);
    if (isNaN(target) || target <= 0) return;
    addGoal({
      type: newGoalType,
      target,
      year: currentYear,
    });
    setNewGoalTarget('');
    setShowForm(false);
  };

  const handleEditSave = (goalId: string) => {
    const target = parseInt(editTarget);
    if (!isNaN(target) && target > 0) {
      updateGoal(goalId, { target });
    }
    setEditingId(null);
  };

  // Achievement badge definitions — all possible badges
  const allAchievements = useMemo(() => {
    const completed = books.filter(b => b.status === 'completed');
    const genres = new Set(completed.map(b => b.genre));
    const totalPages = books.reduce((s, b) => s + b.currentPage, 0);
    const favorites = books.filter(b => b.favorite);
    const totalSessions = books.reduce((s, b) => s + (b.sessions?.length || 0), 0);

    return [
      {
        id: 'first-book', label: 'First Bloom', description: 'Complete your first book',
        icon: 'lotus', color: 'from-gold/20 to-amber/10', iconColor: 'text-gold-dark',
        unlocked: completed.length >= 1, progress: Math.min(completed.length, 1), requirement: 1,
      },
      {
        id: 'bookworm', label: 'Bookworm', description: 'Complete 10 books',
        icon: 'worm', color: 'from-forest/20 to-sage-light/10', iconColor: 'text-forest',
        unlocked: completed.length >= 10, progress: Math.min(completed.length, 10), requirement: 10,
      },
      {
        id: 'scholar', label: 'Scholar', description: 'Complete 25 books',
        icon: 'cap', color: 'from-teal/20 to-teal-light/10', iconColor: 'text-teal',
        unlocked: completed.length >= 25, progress: Math.min(completed.length, 25), requirement: 25,
      },
      {
        id: 'bibliophile', label: 'Bibliophile', description: 'Complete 50 books',
        icon: 'stack', color: 'from-copper/20 to-rose-light/10', iconColor: 'text-copper',
        unlocked: completed.length >= 50, progress: Math.min(completed.length, 50), requirement: 50,
      },
      {
        id: 'centurion', label: 'Centurion', description: 'Complete 100 books',
        icon: 'crown', color: 'from-gold/30 to-amber/20', iconColor: 'text-gold',
        unlocked: completed.length >= 100, progress: Math.min(completed.length, 100), requirement: 100,
      },
      {
        id: 'explorer', label: 'Explorer', description: 'Read books from 5 genres',
        icon: 'compass', color: 'from-teal/20 to-forest/10', iconColor: 'text-teal',
        unlocked: genres.size >= 5, progress: Math.min(genres.size, 5), requirement: 5,
      },
      {
        id: 'renaissance', label: 'Renaissance', description: 'Read 10+ genres',
        icon: 'star', color: 'from-gold/20 to-copper/10', iconColor: 'text-gold-dark',
        unlocked: genres.size >= 10, progress: Math.min(genres.size, 10), requirement: 10,
      },
      {
        id: 'page-turner', label: 'Page Turner', description: 'Read 1,000+ pages',
        icon: 'pages', color: 'from-sage-light/30 to-forest/10', iconColor: 'text-forest',
        unlocked: totalPages >= 1000, progress: Math.min(totalPages, 1000), requirement: 1000,
      },
      {
        id: 'marathon', label: 'Marathon', description: 'Read 10,000+ pages',
        icon: 'flame', color: 'from-copper/20 to-amber/10', iconColor: 'text-copper',
        unlocked: totalPages >= 10000, progress: Math.min(totalPages, 10000), requirement: 10000,
      },
      {
        id: 'curator', label: 'Curator', description: 'Mark 5 books as favorites',
        icon: 'heart', color: 'from-rose/20 to-rose-light/10', iconColor: 'text-rose',
        unlocked: favorites.length >= 5, progress: Math.min(favorites.length, 5), requirement: 5,
      },
      {
        id: 'dedicated', label: 'Dedicated', description: 'Log 30 reading sessions',
        icon: 'journal', color: 'from-teal/15 to-sage-light/10', iconColor: 'text-teal',
        unlocked: totalSessions >= 30, progress: Math.min(totalSessions, 30), requirement: 30,
      },
      {
        id: 'collector', label: 'Collector', description: 'Add 20 books to library',
        icon: 'library', color: 'from-amber/20 to-gold-light/10', iconColor: 'text-amber',
        unlocked: books.length >= 20, progress: Math.min(books.length, 20), requirement: 20,
      },
    ];
  }, [books]);

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Target className="w-8 h-8 text-copper" />
          Reading Goals
        </h1>
        <p className="text-ink-muted mt-1">Set targets, track progress, earn achievements</p>
        <div className="mt-2">
          <MehndiDivider className="h-4 opacity-50" />
        </div>
      </motion.div>

      {/* Decorative lotus divider */}
      <div className="mb-6 -mt-2">
        <LotusDivider className="h-12 opacity-80" />
      </div>

      {/* Block print border */}
      <div className="mb-6">
        <BlockPrintBorder className="h-6 opacity-60" />
      </div>

      {/* Add Goal Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-2xl p-5 space-y-4 overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                New Goal
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.entries(goalTypeConfig) as [ReadingGoal['type'], typeof goalTypeConfig[keyof typeof goalTypeConfig]][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setNewGoalType(type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newGoalType === type
                        ? `bg-gradient-to-br ${config.color} border-gold/30`
                        : 'border-gold-light/20 hover:border-gold-light/40'
                    }`}
                  >
                    <config.icon className={`w-4 h-4 ${config.iconColor} mb-1`} />
                    <p className="text-xs font-medium text-ink">{config.label}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder={`Target ${goalTypeConfig[newGoalType].unit}`}
                  className="flex-1 px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddGoal}
                  className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium shadow-md"
                >
                  Add Goal
                </motion.button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm text-ink-muted">
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="w-full p-4 glass-card rounded-2xl border-2 border-dashed border-gold-light/30 text-ink-muted hover:text-ink hover:border-gold/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add a Reading Goal</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Goals List */}
      <div className="space-y-4 mb-10">
        <AnimatePresence>
          {goalProgress.map(({ goal, config, current, target, percentage, isComplete, paceInfo }, i) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${config.color}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center`}>
                    {isComplete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                      >
                        <Trophy className="w-5 h-5 text-gold" />
                      </motion.div>
                    ) : (
                      <config.icon className={`w-5 h-5 ${config.iconColor}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{config.label}</h3>
                    <p className="text-xs text-ink-muted">{goal.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {editingId === goal.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-gold-light/30 rounded-lg text-sm text-center"
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(goal.id)}
                        autoFocus
                      />
                      <button onClick={() => handleEditSave(goal.id)} className="p-1 text-forest"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-ink-muted"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(goal.id); setEditTarget(String(goal.target)); }}
                        className="p-1 text-ink-muted/40 hover:text-ink-muted transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1 text-ink-muted/40 hover:text-rose transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {current}
                </span>
                <span className="text-ink-muted">/ {target} {config.unit}</span>
              </div>

              <LotusProgressBar progress={percentage} size="md" showPercentage className="mb-2" />

              {paceInfo && (
                <p className="text-xs text-ink-muted">{paceInfo}</p>
              )}
              {isComplete && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gold-dark font-medium mt-1"
                >
                  Goal achieved! Keep going!
                </motion.p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {goals.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-gold-light/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              No goals set yet
            </h3>
            <p className="text-sm text-ink-muted mb-4">Set your first reading goal to stay motivated!</p>
          </motion.div>
        )}
      </div>

      {/* Achievements */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-ink flex items-center gap-2 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Trophy className="w-6 h-6 text-gold" />
          Achievements
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          {allAchievements.filter(a => a.unlocked).length} of {allAchievements.length} unlocked
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allAchievements.map((ach, i) => {
            const pct = ach.requirement > 0 ? Math.round((ach.progress / ach.requirement) * 100) : 0;
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className={`glass-card rounded-xl p-4 text-center relative overflow-hidden transition-all ${
                  ach.unlocked
                    ? `bg-gradient-to-br ${ach.color} border border-gold/20`
                    : 'opacity-60 grayscale border border-gold-light/10'
                }`}
              >
                {/* Lock overlay for locked badges */}
                {!ach.unlocked && (
                  <div className="absolute top-2 right-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" className="text-ink-muted/40">
                      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Badge icon */}
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  ach.unlocked ? 'bg-white/50' : 'bg-gold-light/10'
                }`}>
                  <AchievementIcon type={ach.icon} className={`w-6 h-6 ${ach.unlocked ? ach.iconColor : 'text-ink-muted/40'}`} />
                </div>

                <p className="text-sm font-semibold text-ink">{ach.label}</p>
                <p className="text-[10px] md:text-xs text-ink-muted mt-0.5 mb-2">{ach.description}</p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gold-light/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5 + i * 0.04, duration: 0.6 }}
                    className={`h-full rounded-full ${ach.unlocked ? 'bg-gradient-to-r from-gold to-amber' : 'bg-ink-muted/30'}`}
                  />
                </div>
                <p className="text-[9px] md:text-[11px] text-ink-muted mt-1">
                  {ach.progress.toLocaleString()} / {ach.requirement.toLocaleString()}
                </p>

                {/* Sparkle for unlocked */}
                {ach.unlocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.04, type: 'spring' }}
                    className="absolute -top-1 -right-1"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-gold">
                      <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5Z" fill="currentColor" opacity="0.6" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
