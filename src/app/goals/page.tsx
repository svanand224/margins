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

const goalTypeConfig = {
  'books-per-year': { icon: BookOpen, label: 'Books per Year', unit: 'books', color: 'from-gold/10 to-amber/10', iconColor: 'text-gold-dark' },
  'books-per-month': { icon: Calendar, label: 'Books per Month', unit: 'books', color: 'from-teal/10 to-teal-light/10', iconColor: 'text-teal' },
  'pages-per-day': { icon: FileText, label: 'Pages per Day', unit: 'pages', color: 'from-forest/10 to-sage-light/10', iconColor: 'text-forest' },
  'minutes-per-day': { icon: Clock, label: 'Minutes per Day', unit: 'min', color: 'from-copper/10 to-rose-light/10', iconColor: 'text-copper' },
};

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

  // Achievements
  const achievements = useMemo(() => {
    const completed = books.filter(b => b.status === 'completed');
    const result = [];

    if (completed.length >= 1) result.push({ label: 'First Book', desc: 'Completed your first book', icon: '📖' });
    if (completed.length >= 10) result.push({ label: 'Bookworm', desc: 'Completed 10 books', icon: '🐛' });
    if (completed.length >= 25) result.push({ label: 'Scholar', desc: 'Completed 25 books', icon: '🎓' });
    if (completed.length >= 50) result.push({ label: 'Bibliophile', desc: 'Completed 50 books', icon: '📚' });
    if (completed.length >= 100) result.push({ label: 'Centurion', desc: 'Completed 100 books', icon: '🏆' });

    const genres = new Set(completed.map(b => b.genre));
    if (genres.size >= 5) result.push({ label: 'Explorer', desc: 'Read 5+ genres', icon: '🗺️' });
    if (genres.size >= 10) result.push({ label: 'Renaissance Reader', desc: 'Read 10+ genres', icon: '🌟' });

    const totalPages = books.reduce((s, b) => s + b.currentPage, 0);
    if (totalPages >= 1000) result.push({ label: 'Page Turner', desc: '1,000+ pages read', icon: '📄' });
    if (totalPages >= 10000) result.push({ label: 'Marathon Reader', desc: '10,000+ pages read', icon: '🏃' });

    const favorites = books.filter(b => b.favorite);
    if (favorites.length >= 5) result.push({ label: 'Curator', desc: '5+ favorite books', icon: '❤️' });

    return result;
  }, [books]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Target className="w-8 h-8 text-gold" />
          Reading Goals
        </h1>
        <p className="text-ink-muted mt-1">Set targets, track progress, earn achievements</p>
      </motion.div>

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
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {current}
                </span>
                <span className="text-ink-muted">/ {target} {config.unit}</span>
                <span className="ml-auto text-lg font-bold text-gold-dark" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {percentage}%
                </span>
              </div>

              <div className="h-3 bg-white/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full progress-bar-glow ${
                    isComplete
                      ? 'bg-gradient-to-r from-gold to-amber'
                      : 'bg-gradient-to-r from-forest to-sage'
                  }`}
                />
              </div>

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
        <h2 className="text-2xl font-bold text-ink flex items-center gap-2 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Trophy className="w-6 h-6 text-gold" />
          Achievements
        </h2>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="glass-card rounded-xl p-4 text-center bg-gradient-to-br from-gold/5 to-amber/5"
              >
                <span className="text-2xl mb-2 block">{ach.icon}</span>
                <p className="text-sm font-semibold text-ink">{ach.label}</p>
                <p className="text-[10px] text-ink-muted mt-0.5">{ach.desc}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-sm text-ink-muted">Start reading to unlock achievements!</p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
