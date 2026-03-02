'use client';

import { useBookStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { format, differenceInDays, startOfYear, isThisYear, subDays } from 'date-fns';
import { Thread } from '@/lib/types';
import { MehndiDivider, ElephantWatermark, ChintzFloral, MandalaCorner, LotusDivider, OrnateFrame, BlockPrintBorder, LotusProgressBar } from '@/components/IndianPatterns';
import { useAuth } from '@/lib/auth';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/** Animated Lotus SVG for empty states */
function FloatingLotus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Center petal */}
      <motion.path
        d="M60 10C52 30 50 50 60 75C70 50 68 30 60 10Z"
        stroke="var(--th-gold)"
        strokeWidth="1.5"
        fill="var(--th-gold)"
        fillOpacity="0.1"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {/* Left inner petal */}
      <motion.path
        d="M60 75C50 60 40 45 38 32C42 45 50 60 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1.3"
        fill="var(--th-gold)"
        fillOpacity="0.08"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
      {/* Right inner petal */}
      <motion.path
        d="M60 75C70 60 80 45 82 32C78 45 70 60 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1.3"
        fill="var(--th-gold)"
        fillOpacity="0.08"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
      {/* Left outer petal */}
      <motion.path
        d="M60 75C45 65 28 50 22 38C30 50 45 65 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.05"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      {/* Right outer petal */}
      <motion.path
        d="M60 75C75 65 92 50 98 38C90 50 75 65 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1.2"
        fill="var(--th-gold)"
        fillOpacity="0.05"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      {/* Far left petal */}
      <motion.path
        d="M60 75C40 70 18 55 10 45C20 55 40 68 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      />
      {/* Far right petal */}
      <motion.path
        d="M60 75C80 70 102 55 110 45C100 55 80 68 60 75Z"
        stroke="var(--th-gold)"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      />
      {/* Decorative dots */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="60"
          cy={82 + i * 4}
          r="1"
          fill="var(--th-gold)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4 - i * 0.1, scale: 1 }}
          transition={{ duration: 0.3, delay: 1 + i * 0.1 }}
        />
      ))}
    </svg>
  );
}

const threadIconSvgs: Record<Thread['icon'], ReactNode> = {
  default: (
    <svg width="14" height="14" viewBox="0 0 18 18" className="text-current">
      <path d="M1 9 C5 4, 13 4, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M1 9 C5 14, 13 14, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  paisley: (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-current">
      <path d="M12 2C8 2 4 6 4 12C4 18 8 22 12 22C12 22 16 20 16 14C16 8 12 6 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 10C10 10 12 12 12 16" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  ),
  lotus: (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-current">
      <path d="M12 4C10 8 9 12 12 18C15 12 14 8 12 4Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M12 18C8 14 4 10 5 7C6 10 8 14 12 18Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M12 18C16 14 20 10 19 7C18 10 16 14 12 18Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  ),
  vine: (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-current">
      <path d="M4 20C8 16 10 10 12 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 14C10 12 14 12 16 10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  ),
  elephant: (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-current">
      <path d="M6 12C6 8 8 4 14 4C18 4 20 8 20 12V18H16V14H12V18H8V14H6V12Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <path d="M6 12C4 12 2 14 2 16" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  mandala: (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-current">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line key={angle} x1="12" y1="5" x2="12" y2="2" stroke="currentColor" strokeWidth="1" transform={`rotate(${angle} 12 12)`} opacity="0.5" />
      ))}
    </svg>
  ),
};

const threadColors = [
  { name: 'gold', class: 'from-gold/30 to-amber/20', border: 'border-gold/40', text: 'text-gold-dark' },
  { name: 'forest', class: 'from-forest/30 to-sage-light/20', border: 'border-forest/40', text: 'text-forest' },
  { name: 'teal', class: 'from-teal/30 to-teal-light/20', border: 'border-teal/40', text: 'text-teal' },
  { name: 'copper', class: 'from-copper/30 to-rose-light/20', border: 'border-copper/40', text: 'text-copper' },
  { name: 'plum', class: 'from-plum/30 to-lavender/20', border: 'border-plum/40', text: 'text-plum' },
  { name: 'rose', class: 'from-rose/30 to-rose-light/20', border: 'border-rose/40', text: 'text-rose' },
];

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
  const { books, goals, dailyLogs, readerName, setReaderName, threads, addThread, updateThread, deleteThread, addBookToThread, removeBookFromThread } = useBookStore();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(readerName);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadDesc, setNewThreadDesc] = useState('');
  const [newThreadColor, setNewThreadColor] = useState('gold');
  const [newThreadIcon, setNewThreadIcon] = useState<'paisley' | 'lotus' | 'vine' | 'elephant' | 'mandala' | 'default'>('default');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [threadBookSearch, setThreadBookSearch] = useState('');
  const [managingThreadId, setManagingThreadId] = useState<string | null>(null);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    const fetchUnread = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Recommendation state for completed books section
  const [recommendBookId, setRecommendBookId] = useState<string | null>(null);
  const [recommendSearchQuery, setRecommendSearchQuery] = useState('');
  const [recommendUsers, setRecommendUsers] = useState<Array<{id: string; reader_name: string; avatar_url: string | null; public_slug: string}>>([]);
  const [recommendSending, setRecommendSending] = useState(false);
  const [recommendSent, setRecommendSent] = useState<string | null>(null);
  const [recommendMessage, setRecommendMessage] = useState('');
  // Recommendation mode: 'gold' = gold badge (max 3), 'post' = network post, 'friend' = send to friend
  const [recommendMode, setRecommendMode] = useState<'choose' | 'gold' | 'post' | 'friend'>('choose');
  const [goldNote, setGoldNote] = useState('');
  const [networkPostSent, setNetworkPostSent] = useState(false);
  const [goldSaved, setGoldSaved] = useState(false);

  // ...existing code...

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

  // Search users for recommendations
  useEffect(() => {
    if (!recommendBookId || !recommendSearchQuery.trim()) {
      setRecommendUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, public_slug')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .or(`reader_name.ilike.%${recommendSearchQuery.replace(/[%_(),.]/g, '')}%,public_slug.ilike.%${recommendSearchQuery.replace(/[%_(),.]/g, '')}%`)
        .neq('id', user?.id || '')
        .limit(5);
      setRecommendUsers(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [recommendSearchQuery, recommendBookId, user?.id]);

  const handleRecommendToUser = async (toUserId: string, book: { title: string; author: string }) => {
    if (!user || !isSupabaseConfigured()) return;
    setRecommendSending(true);
    const supabase = createClient();
    await supabase.from('recommendations').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      book_title: book.title,
      book_author: book.author || null,
      message: recommendMessage.trim() || null,
    });
    // Also log an activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'recommended',
      data: { book_title: book.title, book_author: book.author },
    });
    setRecommendSending(false);
    setRecommendSent(toUserId);
    setTimeout(() => {
      setRecommendBookId(null);
      setRecommendSearchQuery('');
      setRecommendMessage('');
      setRecommendSent(null);
      setRecommendMode('choose');
    }, 1500);
  };

  // Gold recommend — max 3 books can have gold badge
  const goldRecommendedCount = books.filter(b => b.goldRecommended).length;

  const handleGoldRecommend = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || !user) return;
    if (goldRecommendedCount >= 3 && !book.goldRecommended) return; // max 3
    setRecommendSending(true);
    const store = useBookStore.getState();
    store.updateBook(bookId, {
      goldRecommended: true,
      goldRecommendedNote: goldNote.trim() || undefined,
    });
    // Post to network
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from('activities').insert({
        user_id: user.id,
        type: 'gold_recommend',
        data: {
          book_title: book.title,
          book_author: book.author,
          note: goldNote.trim(),
        },
      });
    }
    setRecommendSending(false);
    setGoldSaved(true);
    setTimeout(() => {
      setRecommendBookId(null);
      setGoldNote('');
      setGoldSaved(false);
      setRecommendMode('choose');
    }, 1500);
  };

  // Network post — share thoughts about any book
  const handleNetworkPost = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || !user || !isSupabaseConfigured()) return;
    setRecommendSending(true);
    const supabase = createClient();
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'book_post',
      data: {
        book_title: book.title,
        book_author: book.author,
        cover_url: book.coverUrl || null,
        message: recommendMessage.trim(),
        rating: book.rating || null,
      },
    });
    setRecommendSending(false);
    setNetworkPostSent(true);
    setTimeout(() => {
      setRecommendBookId(null);
      setRecommendMessage('');
      setNetworkPostSent(false);
      setRecommendMode('choose');
    }, 1500);
  };

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

    // Today's data
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayLog = dailyLogs.find(l => l.date === todayKey);
    const todayPages = todayLog?.pagesRead || 0;
    const todayMinutes = todayLog?.minutesSpent || 0;
    const todayBooks = todayLog?.booksWorkedOn?.length || 0;

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
      todayPages,
      todayMinutes,
      todayBooks,
    };
  }, [books, goals, dailyLogs]);

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 max-w-6xl mx-auto">
      {/* Alerts Preview */}
      {/* Alerts and toast notifications removed for minimalistic UI */}
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-gold-light/20 px-5 py-5 md:px-8 md:py-6">
          <div className="absolute top-3 right-3 opacity-[0.12]">
            {/* Decorative lotus */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-gold">
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.4" />
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.3" transform="rotate(30 40 40)" />
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.3" transform="rotate(-30 40 40)" />
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.3" transform="rotate(60 40 40)" />
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.3" transform="rotate(-60 40 40)" />
              <ellipse cx="40" cy="40" rx="8" ry="20" fill="currentColor" fillOpacity="0.25" transform="rotate(90 40 40)" />
              <circle cx="40" cy="40" r="6" fill="currentColor" />
            </svg>
          </div>
          {/* Indian pattern accents */}
          <div className="absolute top-0 left-0 w-20 h-20 opacity-60 pointer-events-none">
            <MandalaCorner />
          </div>
          <div className="absolute bottom-0 right-0 w-20 h-20 opacity-60 pointer-events-none rotate-180">
            <MandalaCorner />
          </div>
          <div className="absolute -bottom-4 right-4 w-32 h-28 opacity-[0.12] pointer-events-none">
            <ElephantWatermark />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
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
                className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gold-dark/70 font-medium"
              >
                Margins
              </motion.p>
            </div>
            {user && (
              <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-gold-light/10 transition-colors group">
                <Lucide.Bell className="w-5 h-5 text-ink-muted group-hover:text-gold-dark transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold text-parchment px-1" style={{ background: 'linear-gradient(135deg, var(--th-rose), #e85d75)' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
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
                <Lucide.Edit3 className="w-3 h-3" />
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

      {/* Decorative Indian divider */}
      <div className="mb-6 -mt-2">
        <MehndiDivider className="h-5 opacity-60" />
      </div>

      {/* Quick Stats */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
      >
        {[
          {
            icon: Lucide.BookOpen,
            label: 'Currently Reading',
            value: stats.reading.length,
            color: 'text-forest',
            bg: 'from-forest/10 to-sage-light/10',
          },
          {
            icon: Lucide.Trophy,
            label: 'Books This Year',
            value: stats.completedThisYear.length,
            color: 'text-gold-dark',
            bg: 'from-gold/10 to-amber/10',
          },
          {
            icon: Lucide.Flame,
            label: 'Day Streak',
            value: stats.streak,
            color: 'text-copper',
            bg: 'from-copper/10 to-rose-light/10',
          },
          {
            icon: Lucide.Clock,
            label: 'Total Hours',
            value: Math.round(stats.totalMinutes / 60),
            subtitle: `${stats.totalPages.toLocaleString()} pages`,
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
            {'subtitle' in stat && stat.subtitle && (
              <p className="text-[10px] md:text-xs text-ink-muted/70 mt-0.5">{stat.subtitle}</p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Today's Reading — tracking at a glance */}
      {books.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-r from-gold/5 via-amber/5 to-copper/5 border border-gold-light/15 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Lucide.CalendarDays className="w-4 h-4 text-gold-dark" />
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Today&apos;s Reading</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.todayPages}
                </div>
                <p className="text-[11px] md:text-xs text-ink-muted">pages read</p>
              </div>
              <div className="text-center border-x border-gold-light/20">
                <div className="text-xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.todayMinutes < 60 ? `${stats.todayMinutes}m` : `${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`}
                </div>
                <p className="text-[11px] md:text-xs text-ink-muted">time spent</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {stats.todayBooks}
                </div>
                <p className="text-[11px] md:text-xs text-ink-muted">{stats.todayBooks === 1 ? 'book' : 'books'} worked on</p>
              </div>
            </div>
            {stats.todayPages === 0 && stats.todayMinutes === 0 && (
              <p className="text-center text-xs text-ink-muted/70 mt-3 italic">No reading logged today — open a book and log a session to get started!</p>
            )}
          </div>
        </motion.div>
      )}

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
              <Lucide.BookMarked className="w-5 h-5 text-copper" />
              Currently Reading
            </h2>
            <Link href="/library?status=reading" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
              View all <Lucide.ChevronRight className="w-4 h-4" />
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
                              <Lucide.BookOpen className="w-6 h-6 text-gold-light/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink text-sm truncate">{book.title}</h3>
                          <p className="text-xs text-ink-muted truncate">{book.author}</p>
                          <div className="mt-3">
                            <div className="text-xs text-ink-muted mb-1">
                              <span>Page {book.currentPage} of {book.totalPages}</span>
                            </div>
                            <LotusProgressBar progress={progress} size="sm" showPercentage />
                              {book.rating && (
                                <div className="flex gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, s) => (
                                    <Lucide.Star
                                      key={s}
                                      className={`w-3 h-3 ${s < book.rating! ? 'text-gold fill-gold' : 'text-gold-light/30'}`}
                                    />
                                  ))}
                                </div>
                              )}
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

      {/* To Be Read (TBR) Section — Bookmark List */}
      {stats.reading.length > 0 && stats.totalBooks > 0 && (
        (() => {
          const tbrBooks = books.filter(b => b.status === 'want-to-read');
          if (tbrBooks.length === 0) return null;
          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  <Lucide.Bookmark className="w-5 h-5 text-teal" />
                  Want to Read
                </h2>
                <Link href="/library?status=want-to-read" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
                  View all ({tbrBooks.length}) <Lucide.ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="glass-card rounded-2xl divide-y divide-gold-light/15 overflow-hidden">
                {tbrBooks.slice(0, 6).map((book, i) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <Link href={`/book/${book.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gold-light/5 transition-colors group cursor-pointer">
                        {/* Bookmark icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-teal/10 to-sage-light/10 flex items-center justify-center">
                          <Lucide.Bookmark className="w-4 h-4 text-teal" />
                        </div>
                        {/* Cover thumbnail */}
                        <div className="flex-shrink-0 w-10 h-14 rounded-md bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-sm">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Lucide.BookOpen className="w-4 h-4 text-gold-light/40" />
                            </div>
                          )}
                        </div>
                        {/* Book info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-ink text-sm truncate group-hover:text-gold-dark transition-colors">{book.title}</h3>
                          <p className="text-xs text-ink-muted truncate">{book.author}</p>
                          {book.genre && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal/5 text-teal text-[10px] md:text-xs font-medium border border-teal/10">
                              {book.genre}
                            </span>
                          )}
                        </div>
                        {/* Pages + chevron */}
                        <div className="flex-shrink-0 text-right">
                          {book.totalPages > 0 && (
                            <span className="text-xs text-ink-muted">{book.totalPages}p</span>
                          )}
                          <Lucide.ChevronRight className="w-4 h-4 text-ink-muted/40 group-hover:text-gold-dark transition-colors mt-0.5 ml-auto" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {tbrBooks.length > 6 && (
                  <Link href="/library?status=want-to-read">
                    <div className="px-4 py-3 text-center text-xs text-gold-dark hover:bg-gold-light/5 transition-colors cursor-pointer">
                      +{tbrBooks.length - 6} more books on your list
                    </div>
                  </Link>
                )}
              </div>
            </motion.section>
          );
        })()
      )}

      {/* Lotus Divider before Year Goal */}
      {stats.yearGoal && (
        <div className="mb-6 -mt-2">
          <LotusDivider className="h-12 opacity-80" />
        </div>
      )}

      {/* Year Goal Progress */}
      {stats.yearGoal && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-amber/5 to-copper/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                <Lucide.Target className="w-5 h-5 text-rose" />
                {new Date().getFullYear()} Reading Goal
              </h2>
              <Link href="/goals" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
                Manage <Lucide.ChevronRight className="w-4 h-4" />
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
                <LotusProgressBar 
                  progress={Math.min((stats.completedThisYear.length / stats.yearGoal.target) * 100, 100)} 
                  size="md" 
                  showPercentage 
                  className="mb-2"
                />
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

      {/* Completed Books — with Recommend to Friends */}
      {stats.completed.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <Lucide.Trophy className="w-5 h-5 text-forest" />
              Completed
            </h2>
            <Link href="/library?status=completed" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 transition-colors">
              All ({stats.completed.length}) <Lucide.ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stats.completed
              .sort((a, b) => (b.finishDate || '').localeCompare(a.finishDate || ''))
              .slice(0, 10)
              .map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.04 }}
                  className="group"
                >
                  <div className="glass-card rounded-xl overflow-hidden">
                    <Link href={`/book/${book.id}`}>
                      <div className="book-cover-glow aspect-[2/3] bg-gradient-to-br from-bark to-espresso overflow-hidden relative">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Lucide.BookOpen className="w-8 h-8 text-gold-light/30" />
                          </div>
                        )}
                        {/* Finished badge */}
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-forest/90 flex items-center justify-center shadow-sm">
                          <Lucide.Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        {/* Gold recommend badge */}
                        {book.goldRecommended && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-md" style={{ background: 'linear-gradient(135deg, #D4A855, #E8C878)', color: '#3A2C22' }}>
                            <Lucide.Award className="w-3 h-3" />
                            <span className="text-[9px] md:text-[11px] font-bold">GOLD</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-2.5">
                      <Link href={`/book/${book.id}`}>
                        <p className="text-xs font-medium text-ink truncate group-hover:text-gold-dark transition-colors">{book.title}</p>
                        <p className="text-[10px] md:text-xs text-ink-muted truncate">{book.author}</p>
                      </Link>
                      {book.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Lucide.Star key={s} className={`w-2.5 h-2.5 ${s < book.rating! ? 'text-gold fill-gold' : 'text-gold-light/30'}`} />
                          ))}
                        </div>
                      )}
                      {/* Recommend / Share button */}
                      {user && (
                        <button
                          onClick={() => { setRecommendBookId(book.id); setRecommendSearchQuery(''); setRecommendMessage(''); setRecommendMode('choose'); setGoldNote(''); }}
                          className={`mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] md:text-xs font-medium border transition-colors ${
                            book.goldRecommended
                              ? 'bg-gold/10 text-gold-dark border-gold/20 hover:bg-gold/15'
                              : 'bg-forest/5 text-forest border-forest/10 hover:bg-forest/10'
                          }`}
                        >
                          {book.goldRecommended ? (
                            <><Lucide.Award className="w-3 h-3" /> Gold Pick</>
                          ) : (
                            <><Lucide.Share2 className="w-3 h-3" /> Share</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Share & Recommend Modal — 3 modes */}
          <AnimatePresence>
            {recommendBookId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => { setRecommendBookId(null); setRecommendSearchQuery(''); setRecommendMode('choose'); }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-parchment rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gold-light/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const book = books.find(b => b.id === recommendBookId);
                    if (!book) return null;
                    return (
                      <>
                        {/* Book header */}
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gold-light/20">
                          <div className="w-12 h-[4.5rem] rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-bark to-espresso shadow-md">
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Lucide.BookOpen className="w-5 h-5 text-gold-light/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-ink text-sm truncate">{book.title}</h3>
                            <p className="text-xs text-ink-muted truncate">{book.author}</p>
                            {book.goldRecommended && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4A855, #E8C878)', color: '#3A2C22' }}>
                                <Lucide.Award className="w-2.5 h-2.5" /> Gold Pick
                              </span>
                            )}
                          </div>
                          <button onClick={() => { setRecommendBookId(null); setRecommendMode('choose'); }} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-cream/60 transition-colors">
                            <Lucide.X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode chooser */}
                        {recommendMode === 'choose' && (
                          <div className="space-y-2.5">
                            {/* Gold Recommend */}
                            <button
                              onClick={() => setRecommendMode('gold')}
                              disabled={goldRecommendedCount >= 3 && !book.goldRecommended}
                              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gold/25 hover:border-gold/50 hover:bg-gold/5 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4A855, #E8C878)' }}>
                                <Lucide.Award className="w-5 h-5 text-[#3A2C22]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink group-hover:text-gold-dark transition-colors">Gold Recommend</p>
                                <p className="text-[11px] md:text-xs text-ink-muted">Your top picks with a gold badge ({goldRecommendedCount}/3 used)</p>
                              </div>
                              <Lucide.ChevronRight className="w-4 h-4 text-ink-muted/50 group-hover:text-gold-dark transition-colors" />
                            </button>

                            {/* Post to Network */}
                            <button
                              onClick={() => setRecommendMode('post')}
                              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-forest/20 hover:border-forest/40 hover:bg-forest/5 transition-all text-left group"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-forest/15">
                                <Lucide.Megaphone className="w-5 h-5 text-forest" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink group-hover:text-forest transition-colors">Post to Network</p>
                                <p className="text-[11px] md:text-xs text-ink-muted">Share your thoughts like a post — visible to all followers</p>
                              </div>
                              <Lucide.ChevronRight className="w-4 h-4 text-ink-muted/50 group-hover:text-forest transition-colors" />
                            </button>

                            {/* Send to a Friend */}
                            <button
                              onClick={() => setRecommendMode('friend')}
                              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-teal/20 hover:border-teal/40 hover:bg-teal/5 transition-all text-left group"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-teal/15">
                                <Lucide.Send className="w-5 h-5 text-teal" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink group-hover:text-teal transition-colors">Send to a Friend</p>
                                <p className="text-[11px] md:text-xs text-ink-muted">Privately recommend this book to someone specific</p>
                              </div>
                              <Lucide.ChevronRight className="w-4 h-4 text-ink-muted/50 group-hover:text-teal transition-colors" />
                            </button>
                          </div>
                        )}

                        {/* Gold Recommend Mode */}
                        {recommendMode === 'gold' && (
                          <div>
                            {goldSaved ? (
                              <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4A855, #E8C878)' }}>
                                  <Lucide.Award className="w-7 h-7 text-[#3A2C22]" />
                                </div>
                                <p className="text-sm font-semibold text-ink">Gold badge added!</p>
                                <p className="text-xs text-ink-muted mt-1">Your network has been notified.</p>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => setRecommendMode('choose')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3 transition-colors">
                                  <Lucide.ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                                <p className="text-xs text-ink-muted mb-3">
                                  Give <strong className="text-ink">{book.title}</strong> your personal gold badge. Tell everyone why it&apos;s a must-read.
                                </p>
                                <textarea
                                  value={goldNote}
                                  onChange={(e) => setGoldNote(e.target.value)}
                                  placeholder="Why do you love this book? What makes it special?"
                                  className="w-full px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none mb-3"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleGoldRecommend(book.id)}
                                  disabled={recommendSending}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-[#3A2C22] shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                                  style={{ background: 'linear-gradient(135deg, #D4A855, #E8C878)' }}
                                >
                                  {recommendSending ? <Lucide.Loader2 className="w-4 h-4 animate-spin" /> : <><Lucide.Award className="w-4 h-4" /> Award Gold Badge</>}
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Post to Network Mode */}
                        {recommendMode === 'post' && (
                          <div>
                            {networkPostSent ? (
                              <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-forest/15">
                                  <Lucide.Check className="w-7 h-7 text-forest" />
                                </div>
                                <p className="text-sm font-semibold text-ink">Posted to your network!</p>
                                <p className="text-xs text-ink-muted mt-1">Your followers can now see this in their feed.</p>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => setRecommendMode('choose')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3 transition-colors">
                                  <Lucide.ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                                <p className="text-xs text-ink-muted mb-3">
                                  Share your thoughts about <strong className="text-ink">{book.title}</strong> with your network — like an Instagram post for readers.
                                </p>
                                <textarea
                                  value={recommendMessage}
                                  onChange={(e) => setRecommendMessage(e.target.value)}
                                  placeholder="What did you think? Any favorite moments or quotes?"
                                  className="w-full px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none mb-3"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleNetworkPost(book.id)}
                                  disabled={recommendSending || !recommendMessage.trim()}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-parchment shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                                  style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-sage))' }}
                                >
                                  {recommendSending ? <Lucide.Loader2 className="w-4 h-4 animate-spin" /> : <><Lucide.Megaphone className="w-4 h-4" /> Post to Network</>}
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Send to Friend Mode */}
                        {recommendMode === 'friend' && (
                          <div>
                            {recommendSent ? (
                              <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-teal/15">
                                  <Lucide.Check className="w-7 h-7 text-teal" />
                                </div>
                                <p className="text-sm font-semibold text-ink">Recommendation sent!</p>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => setRecommendMode('choose')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3 transition-colors">
                                  <Lucide.ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                                <div className="mb-3">
                                  <input
                                    type="text"
                                    value={recommendSearchQuery}
                                    onChange={(e) => setRecommendSearchQuery(e.target.value)}
                                    placeholder="Search by username..."
                                    className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                                    autoFocus
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-ink-muted mb-1 uppercase tracking-wider">
                                    Your message <span className="text-rose">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={recommendMessage}
                                    onChange={(e) => setRecommendMessage(e.target.value)}
                                    placeholder="I think you'd love this because..."
                                    className={`w-full px-3 py-2 rounded-xl bg-cream/50 border text-ink text-sm placeholder:text-ink-muted/60 ${!recommendMessage.trim() ? 'border-rose/30' : 'border-gold-light/30'}`}
                                  />
                                  {!recommendMessage.trim() && (
                                    <p className="text-[10px] md:text-xs text-rose/70 mt-1">A message is required before sending.</p>
                                  )}
                                </div>
                                {recommendUsers.length > 0 && (
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {recommendUsers.map(u => (
                                      <button
                                        key={u.id}
                                        onClick={() => handleRecommendToUser(u.id, { title: book.title, author: book.author })}
                                        disabled={recommendSending || !recommendMessage.trim()}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gold-light/10 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        {u.avatar_url ? (
                                          <img src={u.avatar_url} alt={u.reader_name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment text-xs font-bold">
                                            {u.reader_name.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-ink truncate">{u.reader_name}</p>
                                          <p className="text-[10px] md:text-xs text-ink-muted">@{u.public_slug}</p>
                                        </div>
                                        {recommendSent === u.id ? (
                                          <div className="flex items-center gap-1 text-forest text-xs">
                                            <Lucide.Check className="w-3.5 h-3.5" /> Sent!
                                          </div>
                                        ) : (
                                          <Lucide.Send className="w-4 h-4 text-teal" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {recommendSearchQuery.trim() && recommendUsers.length === 0 && !recommendSending && (
                                  <p className="text-xs text-ink-muted text-center py-3">No users found. Try a different search.</p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* Empty State */}
      {books.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16 relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6 relative z-10"
          >
            <FloatingLotus className="w-28 h-24 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Your reading adventure begins here
          </h2>
          <p className="text-ink-muted mb-8 max-w-md mx-auto relative z-10">
            Add your first book to start tracking your journey through worlds of wonder.
          </p>
          <Link href="/add" className="relative z-10">
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

      {/* Lotus Divider before Threads */}
      {(books.length >= 2 || threads.length > 0) && (
        <div className="mb-4 -mt-4">
          <LotusDivider className="h-10 opacity-70" />
        </div>
      )}

      {/* Threads — Custom collections to organize your library */}
      {(books.length >= 2 || threads.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                <Lucide.Library className="w-5 h-5 text-copper" />
                Threads
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">Group books into collections — by mood, theme, genre, or anything you like</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewThread(!showNewThread)}
              className="flex items-center gap-1 text-xs text-gold-dark hover:text-gold transition-colors px-3 py-1.5 rounded-lg border border-gold-light/30 hover:bg-gold-light/10"
            >
              <Lucide.Plus className="w-3.5 h-3.5" /> New Thread
            </motion.button>
          </div>

          {/* New Thread Form */}
          <AnimatePresence>
            {showNewThread && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newThreadName}
                    onChange={(e) => setNewThreadName(e.target.value)}
                    placeholder="Thread name (e.g., Summer 2025, Comfort Reads, Deep Dives)"
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-lg text-sm text-ink"
                  />
                  <input
                    type="text"
                    value={newThreadDesc}
                    onChange={(e) => setNewThreadDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-lg text-sm text-ink"
                  />
                  <div>
                    <p className="text-xs text-ink-muted mb-1.5">Icon</p>
                    <div className="flex gap-2">
                      {(Object.keys(threadIconSvgs) as Thread['icon'][]).map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewThreadIcon(icon)}
                          className={`p-2 rounded-lg border transition-all ${newThreadIcon === icon ? 'bg-gold/10 border-gold/30 text-gold-dark' : 'border-gold-light/20 text-ink-muted hover:border-gold-light/40'}`}
                        >
                          {threadIconSvgs[icon]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted mb-1.5">Color</p>
                    <div className="flex gap-2">
                      {threadColors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setNewThreadColor(c.name)}
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.class} border-2 transition-all ${newThreadColor === c.name ? 'border-ink scale-110' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!newThreadName.trim()) return;
                        addThread({
                          name: newThreadName.trim(),
                          description: newThreadDesc.trim() || undefined,
                          color: newThreadColor,
                          icon: newThreadIcon,
                          bookIds: [],
                        });
                        setNewThreadName('');
                        setNewThreadDesc('');
                        setNewThreadColor('gold');
                        setNewThreadIcon('default');
                        setShowNewThread(false);
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-gold to-amber text-white rounded-lg text-xs font-medium"
                    >
                      Create Shelf
                    </motion.button>
                    <button onClick={() => setShowNewThread(false)} className="px-3 py-2 text-xs text-ink-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {/* Custom threads */}
            {threads.map((thread) => {
              const color = threadColors.find(c => c.name === thread.color) || threadColors[0];
              const threadBooks = thread.bookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
              const isManaging = managingThreadId === thread.id;

              return (
                <div key={thread.id} className={`relative glass-card rounded-xl p-3 pl-5 bg-gradient-to-r ${color.class} border ${color.border}`}>
                  <div className={`absolute left-2 top-3 bottom-3 w-px bg-gradient-to-b ${color.text} opacity-50`} />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={color.text}>{threadIconSvgs[thread.icon]}</span>
                      <p className={`text-xs font-medium ${color.text} uppercase tracking-wider`}>{thread.name}</p>
                      <span className="text-[10px] md:text-xs text-ink-muted">({threadBooks.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setManagingThreadId(isManaging ? null : thread.id)}
                        className="p-1 rounded text-ink-muted/50 hover:text-gold-dark transition-colors"
                      >
                        <Lucide.Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteThread(thread.id)}
                        className="p-1 rounded text-ink-muted/50 hover:text-rose transition-colors"
                      >
                        <Lucide.Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {thread.description && <p className="text-[10px] md:text-xs text-ink-muted mb-2 italic">{thread.description}</p>}

                  {/* Manage books in thread */}
                  <AnimatePresence>
                    {isManaging && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-2"
                      >
                        <div className="p-2 bg-cream/30 rounded-lg space-y-2">
                          <input
                            type="text"
                            value={threadBookSearch}
                            onChange={(e) => setThreadBookSearch(e.target.value)}
                            placeholder="Search books to add..."
                            className="w-full px-2 py-1.5 bg-white/50 border border-gold-light/20 rounded-md text-xs text-ink"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {books
                              .filter(b => !thread.bookIds.includes(b.id))
                              .filter(b => !threadBookSearch || b.title.toLowerCase().includes(threadBookSearch.toLowerCase()) || b.author.toLowerCase().includes(threadBookSearch.toLowerCase()))
                              .slice(0, 8)
                              .map(b => (
                                <button
                                  key={b.id}
                                  onClick={() => { addBookToThread(thread.id, b.id); setThreadBookSearch(''); }}
                                  className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-gold-light/10 transition-colors"
                                >
                                  <Lucide.Plus className="w-3 h-3 text-gold-dark" />
                                  <span className="text-xs text-ink truncate">{b.title}</span>
                                  <span className="text-[10px] md:text-xs text-ink-muted ml-auto">{b.author}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {threadBooks.length > 0 ? threadBooks.slice(0, 8).map((b) => (
                      <div key={b!.id} className="flex-shrink-0 group relative">
                        <Link href={`/book/${b!.id}`}>
                          <div className="book-cover-glow w-12 h-[4.5rem] rounded-lg bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-sm">
                            {b!.coverUrl ? (
                              <img src={b!.coverUrl} alt={b!.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Lucide.BookOpen className="w-4 h-4 text-gold-light/30" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs text-ink-muted truncate w-12 mt-1 group-hover:text-gold-dark transition-colors">{b!.title}</p>
                        </Link>
                        {isManaging && (
                          <button
                            onClick={() => removeBookFromThread(thread.id, b!.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose text-white flex items-center justify-center"
                          >
                            <Lucide.X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )) : (
                      <p className="text-[10px] md:text-xs text-ink-muted italic py-2">Click <Lucide.Settings className="w-3 h-3 inline" /> to add books to this thread.</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Show hint when no custom threads exist */}
            {threads.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center border-2 border-dashed border-gold-light/20">
                <Lucide.Library className="w-10 h-10 text-gold-light/30 mx-auto mb-2" />
                <p className="text-sm text-ink-muted">Create your first thread to group books into collections.</p>
                <p className="text-xs text-ink-muted/60 mt-1">Threads are like custom bookshelves — organize by mood, theme, series, or any way you like.</p>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Block print border between sections */}
      {books.length > 0 && (
        <div className="my-8">
          <BlockPrintBorder className="h-12" />
        </div>
      )}

      {/* Quick Stats Bar */}
      {books.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-teal/5 to-sage-light/5 relative overflow-hidden">
            {/* Decorative lotus corners */}
            <div className="absolute -top-2 -left-2 w-16 h-16 opacity-40 pointer-events-none">
              <ChintzFloral />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 opacity-40 pointer-events-none rotate-180">
              <ChintzFloral />
            </div>
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <Lucide.TrendingUp className="w-5 h-5 text-teal" />
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

      {/* Recommended to You */}
      {/* ...existing code... */}
    </div>
  );
}
