'use client';

import { useBookStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  BookMarked,
  Trophy,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Star,
  Flame,
  Target,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { format, differenceInDays, startOfYear, isThisYear, subDays } from 'date-fns';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const quotes = [
  { text: "Between the pages of a book is a lovely place to be.", author: "Unknown" },
  { text: "Books are mirrors: you only see in them what you already have inside you.", author: "Carlos Ruiz Zafón" },
  { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz" },
  { text: "Sleep is good, he said, and books are better.", author: "George R.R. Martin" },
  { text: "I kept always two books in my pocket, one to read, one to write in.", author: "Robert Louis Stevenson" },
  { text: "Reading is an exercise in empathy; an exercise in walking in someone else's shoes.", author: "Malorie Blackman" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "The world was hers for the reading.", author: "Betty Smith" },
  { text: "In the case of good books, the point is not to see how many of them you can get through, but how many can get through to you.", author: "Mortimer J. Adler" },
  { text: "There is no frigate like a book to take us lands away.", author: "Emily Dickinson" },
  { text: "Reading brings us unknown friends.", author: "Honoré de Balzac" },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass" },
];

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 6) return `Midnight reading, ${name}?`;
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  if (h < 21) return `Good evening, ${name}`;
  return `Late night chapter, ${name}?`;
}

export default function HomePage() {
  const { books, goals, dailyLogs, readerName, setReaderName } = useBookStore();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(readerName);

  // Cycle quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveName = useCallback(() => {
    if (nameInput.trim()) {
      setReaderName(nameInput.trim());
    }
    setEditingName(false);
  }, [nameInput, setReaderName]);

  const quote = quotes[quoteIndex];

  const stats = useMemo(() => {
    const reading = books.filter(b => b.status === 'reading');
    const completed = books.filter(b => b.status === 'completed');
    const completedThisYear = completed.filter(b => b.finishDate && isThisYear(new Date(b.finishDate)));
    const totalPages = books.reduce((sum, b) => sum + b.currentPage, 0);
    const totalSessions = books.reduce((sum, b) => sum + b.sessions.length, 0);
    const totalMinutes = books.reduce(
      (sum, b) => sum + b.sessions.reduce((s, sess) => s + sess.minutesSpent, 0),
      0
    );

    // Reading streak
    let streak = 0;
    const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sortedLogs.find(l => l.date === checkDate)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Books per year goal progress
    const yearGoal = goals.find(g => g.type === 'books-per-year' && g.year === new Date().getFullYear());
    const daysIntoYear = differenceInDays(new Date(), startOfYear(new Date())) + 1;
    const paceNeeded = yearGoal ? (yearGoal.target / 365) * daysIntoYear : 0;

    return {
      reading,
      completed,
      completedThisYear,
      totalPages,
      totalSessions,
      totalMinutes,
      streak,
      yearGoal,
      paceNeeded: Math.round(paceNeeded),
      totalBooks: books.length,
    };
  }, [books, goals, dailyLogs]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-gold-light/20 px-5 py-5 md:px-8 md:py-6">
          <div className="absolute top-3 right-3 opacity-[0.06]">
            <Sparkles className="w-20 h-20 text-gold" />
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-ink-muted text-xs tracking-wide"
            >
              {format(new Date(), 'EEEE, MMMM d')}
            </motion.p>
            <span className="text-ink-muted/30 text-xs hidden sm:inline">·</span>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] uppercase tracking-[0.2em] text-gold-dark/70 font-medium"
            >
              Margins
            </motion.p>
          </div>

          {/* Greeting with editable name */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-baseline gap-2 mb-2.5 flex-wrap"
          >
            {editingName ? (
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                onBlur={handleSaveName}
                className="text-xl md:text-2xl font-semibold text-ink bg-transparent border-b border-gold/30 outline-none px-0"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                autoFocus
              />
            ) : (
              <h1
                className="text-xl md:text-2xl font-semibold text-ink"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {getGreeting(readerName)}
              </h1>
            )}
            {!editingName && (
              <button
                onClick={() => { setNameInput(readerName); setEditingName(true); }}
                className="p-1 rounded-full hover:bg-gold-light/15 transition-colors text-ink-muted/50 hover:text-gold-dark"
                title="Edit name"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </motion.div>

          {/* Cycling quotes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-lg h-12 relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-ink-light/70 italic text-sm leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                <p className="text-gold-dark/60 text-xs mt-0.5">— {quote.author}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
      >
        {[
          {
            icon: BookOpen,
            label: 'Currently Reading',
            value: stats.reading.length,
            color: 'text-forest',
            bg: 'from-forest/10 to-sage-light/10',
          },
          {
            icon: Trophy,
            label: 'Completed This Year',
            value: stats.completedThisYear.length,
            color: 'text-gold-dark',
            bg: 'from-gold/10 to-amber/10',
          },
          {
            icon: Flame,
            label: 'Day Streak',
            value: stats.streak,
            color: 'text-copper',
            bg: 'from-copper/10 to-rose-light/10',
          },
          {
            icon: Clock,
            label: 'Hours Read',
            value: Math.round(stats.totalMinutes / 60),
            color: 'text-teal',
            bg: 'from-teal/10 to-teal-light/10',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className={`glass-card rounded-2xl p-4 md:p-5 bg-gradient-to-br ${stat.bg}`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-2xl md:text-3xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {stat.value}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Currently Reading */}
      {stats.reading.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <BookMarked className="w-5 h-5 text-gold" />
              Currently Reading
            </h2>
            <Link href="/library?status=reading" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.reading.slice(0, 3).map((book, i) => {
              const progress = book.totalPages > 0
                ? Math.round((book.currentPage / book.totalPages) * 100)
                : 0;
              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <Link href={`/book/${book.id}`}>
                    <div className="book-card glass-card rounded-2xl p-4 cursor-pointer">
                      <div className="flex gap-4">
                        <div className="book-cover-glow w-16 h-24 rounded-lg bg-gradient-to-br from-bark to-espresso flex-shrink-0 overflow-hidden shadow-lg">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gold-light/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink text-sm truncate">{book.title}</h3>
                          <p className="text-xs text-ink-muted truncate">{book.author}</p>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
                              <span>Page {book.currentPage} of {book.totalPages}</span>
                              <span className="font-medium text-gold-dark">{progress}%</span>
                            </div>
                            <div className="h-2 bg-cream rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.7 + i * 0.1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-gold to-amber rounded-full progress-bar-glow"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Year Goal Progress */}
      {stats.yearGoal && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-gold/5 to-amber/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                <Target className="w-5 h-5 text-gold" />
                {new Date().getFullYear()} Reading Goal
              </h2>
              <Link href="/goals" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
                Manage <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {stats.completedThisYear.length}
                  </span>
                  <span className="text-ink-muted">of {stats.yearGoal.target} books</span>
                </div>
                <div className="h-3 bg-cream rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.completedThisYear.length / stats.yearGoal.target) * 100, 100)}%` }}
                    transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-forest to-sage rounded-full progress-bar-glow"
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  {stats.completedThisYear.length >= stats.paceNeeded
                    ? "You're ahead of pace!"
                    : `Read ${stats.paceNeeded - stats.completedThisYear.length} more to be on track`}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Recently Completed */}
      {stats.completed.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <Star className="w-5 h-5 text-gold" />
              Recently Completed
            </h2>
            <Link href="/library?status=completed" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {stats.completed
              .sort((a, b) => (b.finishDate || '').localeCompare(a.finishDate || ''))
              .slice(0, 6)
              .map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="flex-shrink-0"
                >
                  <Link href={`/book/${book.id}`}>
                    <div className="book-card w-28 group cursor-pointer">
                      <div className="book-cover-glow w-28 h-40 rounded-xl bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-lg mb-2">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gold-light/30" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-ink truncate">{book.title}</p>
                      <p className="text-[10px] text-ink-muted truncate">{book.author}</p>
                      {book.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s < book.rating! ? 'text-gold fill-gold' : 'text-gold-light/30'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </motion.section>
      )}

      {/* Empty State */}
      {books.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <BookOpen className="w-20 h-20 text-gold-light mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Your reading adventure begins here
          </h2>
          <p className="text-ink-muted mb-8 max-w-md mx-auto">
            Add your first book to start tracking your journey through worlds of wonder.
          </p>
          <Link href="/add">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-gold to-amber text-white rounded-xl font-medium shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-shadow"
            >
              Add Your First Book
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Threads — Related books connected by genre/tags */}
      {books.length >= 2 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" className="text-gold">
                <path d="M1 9 C5 4, 13 4, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M1 9 C5 14, 13 14, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
              </svg>
              Threads
            </h2>
          </div>
          {(() => {
            // Group books by genre
            const genreGroups: Record<string, typeof books> = {};
            books.forEach(b => {
              if (b.genre) {
                if (!genreGroups[b.genre]) genreGroups[b.genre] = [];
                genreGroups[b.genre].push(b);
              }
            });
            const threads = Object.entries(genreGroups)
              .filter(([, group]) => group.length >= 2)
              .sort((a, b) => b[1].length - a[1].length)
              .slice(0, 3);

            if (threads.length === 0) return (
              <p className="text-sm text-ink-muted italic">Add more books with shared genres to discover threads.</p>
            );

            return (
              <div className="space-y-3">
                {threads.map(([genre, group]) => (
                  <div
                    key={genre}
                    className="relative glass-card rounded-xl p-3 pl-5"
                  >
                    <div className="absolute left-2 top-3 bottom-3 w-px bg-gradient-to-b from-gold-light/50 via-gold/30 to-transparent" />
                    <p className="text-xs font-medium text-gold-dark mb-2 uppercase tracking-wider">{genre}</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {group.slice(0, 6).map((b) => (
                        <Link key={b.id} href={`/book/${b.id}`} className="flex-shrink-0 group">
                          <div className="book-cover-glow w-12 h-[4.5rem] rounded-lg bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-sm">
                            {b.coverUrl ? (
                              <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gold-light/30" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-ink-muted truncate w-12 mt-1 group-hover:text-gold-dark transition-colors">{b.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </motion.section>
      )}

      {/* Quick Stats Bar */}
      {books.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-teal/5 to-sage-light/5">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <TrendingUp className="w-5 h-5 text-teal" />
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.totalBooks}
                </p>
                <p className="text-xs text-ink-muted">Total Books</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.totalPages.toLocaleString()}
                </p>
                <p className="text-xs text-ink-muted">Pages Read</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.totalSessions}
                </p>
                <p className="text-xs text-ink-muted">Reading Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {books.filter(b => b.favorite).length}
                </p>
                <p className="text-xs text-ink-muted">Favorites</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
