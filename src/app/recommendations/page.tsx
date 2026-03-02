'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { useBookStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Inbox,
  Send,
  Sparkles,
  Check,
  X,
  BookOpen,
  Loader2,
  ArrowLeft,
  Lock,
  Trophy,
  Star,
  ChevronRight,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/lib/types';
import { searchBooks } from '@/lib/bookApi';

interface Recommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
  book_isbn: string | null;
  message: string | null;
  status: string;
  created_at: string;
  from_user?: { reader_name: string; avatar_url: string | null; public_slug: string | null };
  to_user?: { reader_name: string; avatar_url: string | null; public_slug: string | null };
}

interface AutoRec {
  title: string;
  author: string;
  coverUrl: string;
  genre: string;
  reason: string;
}

type TabType = 'inbox' | 'sent' | 'discover';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const books = useBookStore((s) => s.books);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [inbox, setInbox] = useState<Recommendation[]>([]);
  const [sent, setSent] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  // Auto-recs
  const [autoRecs, setAutoRecs] = useState<AutoRec[]>([]);
  const [autoRecsLoading, setAutoRecsLoading] = useState(false);
  const [autoRecsGenerated, setAutoRecsGenerated] = useState(false);

  // Send rec
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendBookQuery, setSendBookQuery] = useState('');
  const [sendBookResults, setSendBookResults] = useState<Partial<Book>[]>([]);
  const [sendBookSearching, setSendBookSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Partial<Book> | null>(null);
  const [sendUserQuery, setSendUserQuery] = useState('');
  const [sendUsers, setSendUsers] = useState<Array<{ id: string; reader_name: string; avatar_url: string | null; public_slug: string }>>([]);
  const [sendMessage, setSendMessage] = useState('');
  const [sendingRec, setSendingRec] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [shareNetworkSuccess, setShareNetworkSuccess] = useState(false);

  const completedBooks = useMemo(() => books.filter(b => b.status === 'completed'), [books]);
  const autoRecsUnlocked = completedBooks.length >= 5;

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user || !isSupabaseConfigured()) { setLoading(false); return; }
    const supabase = createClient();

    const [{ data: inboxData }, { data: sentData }] = await Promise.all([
      supabase
        .from('recommendations')
        .select('*, from_user:from_user_id(reader_name, avatar_url, public_slug)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('recommendations')
        .select('*, to_user:to_user_id(reader_name, avatar_url, public_slug)')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    setInbox((inboxData as unknown as Recommendation[]) || []);
    setSent((sentData as unknown as Recommendation[]) || []);
    setLoading(false);
  };

  const handleAccept = async (rec: Recommendation) => {
    if (!user) return;
    setAccepting(rec.id);
    const supabase = createClient();

    // Update recommendation status
    await supabase.from('recommendations').update({ status: 'accepted' }).eq('id', rec.id);

    // Add this book to user's TBR
    const { data: profile } = await supabase
      .from('profiles')
      .select('reading_data')
      .eq('id', user.id)
      .single();

    if (profile) {
      const existingBooks: Book[] = profile.reading_data?.books || [];
      // Check if book already exists
      const alreadyExists = existingBooks.some(
        (b) => b.title.toLowerCase() === rec.book_title.toLowerCase()
      );

      if (!alreadyExists) {
        // Add to local Zustand store (which auto-generates id, dateAdded, sessions, favorite)
        useBookStore.getState().addBook({
          title: rec.book_title,
          author: rec.book_author || 'Unknown Author',
          isbn: rec.book_isbn || '',
          coverUrl: rec.book_cover_url || '',
          totalPages: 0,
          currentPage: 0,
          status: 'want-to-read',
          genre: '',
          tags: ['recommended'],
          notes: rec.message ? `Recommended by ${(rec.from_user as any)?.reader_name || 'a friend'}: "${rec.message}"` : `Recommended by ${(rec.from_user as any)?.reader_name || 'a friend'}`,
        });

        // Sync updated books to Supabase
        const updatedBooks = useBookStore.getState().books;
        await supabase
          .from('profiles')
          .update({ reading_data: { ...profile.reading_data, books: updatedBooks } })
          .eq('id', user.id);
      }
    }

    // Update local state
    setInbox(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'accepted' } : r));
    setAccepting(null);
  };

  const handleDismiss = async (rec: Recommendation) => {
    setDismissing(rec.id);
    const supabase = createClient();
    await supabase.from('recommendations').update({ status: 'dismissed' }).eq('id', rec.id);
    setInbox(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'dismissed' } : r));
    setDismissing(null);
  };

  // Build taste profile from completed books
  const tasteProfile = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    const highRatedBooks: Book[] = [];

    completedBooks.forEach(book => {
      if (book.genre) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      }
      if (book.author) {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }
      if (book.rating && book.rating >= 4) {
        highRatedBooks.push(book);
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a);

    return { topGenres, topAuthors, highRatedBooks, genreCounts };
  }, [completedBooks]);

  const generateAutoRecs = async () => {
    if (!autoRecsUnlocked) return;
    setAutoRecsLoading(true);
    setAutoRecs([]);

    const existingTitles = new Set(books.map(b => b.title.toLowerCase()));
    const recommendations: AutoRec[] = [];

    // Strategy 1: Search by top genres
    for (const genre of tasteProfile.topGenres.slice(0, 2)) {
      try {
        const results = await searchBooks(`${genre} bestseller`);
        for (const result of results.slice(0, 3)) {
          if (result.title && !existingTitles.has(result.title.toLowerCase()) && !recommendations.some(r => r.title === result.title)) {
            recommendations.push({
              title: result.title,
              author: result.author || 'Unknown Author',
              coverUrl: result.coverUrl || '',
              genre: result.genre || genre,
              reason: `Because you love ${genre}`,
            });
          }
        }
      } catch { /* skip */ }
    }

    // Strategy 2: Search "similar to" high-rated books
    const topRated = tasteProfile.highRatedBooks.slice(0, 2);
    for (const book of topRated) {
      try {
        const results = await searchBooks(`books similar to ${book.title}`);
        for (const result of results.slice(0, 2)) {
          if (result.title && !existingTitles.has(result.title.toLowerCase()) && !recommendations.some(r => r.title === result.title)) {
            recommendations.push({
              title: result.title,
              author: result.author || 'Unknown Author',
              coverUrl: result.coverUrl || '',
              genre: result.genre || '',
              reason: `Because you rated "${book.title}" highly`,
            });
          }
        }
      } catch { /* skip */ }
    }

    // Strategy 3: Search by favorite authors
    for (const author of tasteProfile.topAuthors.slice(0, 2)) {
      try {
        const results = await searchBooks(`author:${author}`);
        for (const result of results.slice(0, 2)) {
          if (result.title && !existingTitles.has(result.title.toLowerCase()) && !recommendations.some(r => r.title === result.title)) {
            recommendations.push({
              title: result.title,
              author: result.author || author,
              coverUrl: result.coverUrl || '',
              genre: result.genre || '',
              reason: `More from ${author}`,
            });
          }
        }
      } catch { /* skip */ }
    }

    // Shuffle and limit
    const shuffled = recommendations.sort(() => Math.random() - 0.5).slice(0, 8);
    setAutoRecs(shuffled);
    setAutoRecsLoading(false);
    setAutoRecsGenerated(true);
  };

  const handleAddAutoRecToTBR = async (rec: AutoRec) => {
    if (!user || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('reading_data')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const existingBooks: Book[] = profile.reading_data?.books || [];
    const alreadyExists = existingBooks.some(b => b.title.toLowerCase() === rec.title.toLowerCase());
    if (alreadyExists) return;

    useBookStore.getState().addBook({
      title: rec.title,
      author: rec.author,
      coverUrl: rec.coverUrl,
      totalPages: 0,
      currentPage: 0,
      status: 'want-to-read',
      genre: rec.genre,
      tags: ['auto-recommended'],
      notes: `Auto-recommended: ${rec.reason}`,
    });

    const updatedBooks = useBookStore.getState().books;
    await supabase
      .from('profiles')
      .update({ reading_data: { ...profile.reading_data, books: updatedBooks } })
      .eq('id', user.id);

    // Remove from auto recs
    setAutoRecs(prev => prev.filter(r => r.title !== rec.title));
  };

  // Search books for send modal
  useEffect(() => {
    if (!sendBookQuery.trim()) { setSendBookResults([]); return; }
    const timer = setTimeout(async () => {
      setSendBookSearching(true);
      try {
        const results = await searchBooks(sendBookQuery);
        setSendBookResults(results.slice(0, 5));
      } catch { setSendBookResults([]); }
      setSendBookSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [sendBookQuery]);

  // Search users for send modal
  useEffect(() => {
    if (!sendUserQuery.trim()) { setSendUsers([]); return; }
    const timer = setTimeout(async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, public_slug')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .or(`reader_name.ilike.%${sendUserQuery}%,public_slug.ilike.%${sendUserQuery}%`)
        .neq('id', user?.id || '')
        .limit(5);
      setSendUsers(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [sendUserQuery, user?.id]);

  const handleSendRec = async (toUserId: string) => {
    if (!user || !selectedBook) return;
    setSendingRec(true);
    const supabase = createClient();

    const { error } = await supabase.from('recommendations').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      book_title: selectedBook.title || '',
      book_author: selectedBook.author || null,
      book_cover_url: selectedBook.coverUrl || null,
      book_isbn: selectedBook.isbn || null,
      message: sendMessage.trim() || null,
    });

    if (!error) {
      // Log activity
      supabase.from('activities').insert({
        user_id: user.id,
        type: 'recommended',
        data: { book_title: selectedBook.title, book_author: selectedBook.author },
      }).then(() => {});

      // Create notification
      supabase.from('notifications').insert({
        user_id: toUserId,
        type: 'new_recommendation',
        from_user_id: user.id,
        data: { book_title: selectedBook.title },
      }).then(() => {});

      setSendSuccess(true);
      setTimeout(() => {
        setShowSendModal(false);
        setSelectedBook(null);
        setSendBookQuery('');
        setSendUserQuery('');
        setSendMessage('');
        setSendSuccess(false);
        fetchRecommendations();
      }, 1500);
    }
    setSendingRec(false);
  };

  const handleShareWithNetwork = async () => {
    if (!user || !selectedBook) return;
    setSendingRec(true);
    const supabase = createClient();

    // Post as activity to the user's feed for their followers to see
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'recommended',
      data: {
        book_title: selectedBook.title,
        book_author: selectedBook.author,
        book_cover_url: selectedBook.coverUrl,
        message: sendMessage.trim() || `I just finished "${selectedBook.title}" and highly recommend it!`,
        shared_to_network: true,
      },
    });

    setShareNetworkSuccess(true);
    setTimeout(() => {
      setShowSendModal(false);
      setSelectedBook(null);
      setSendBookQuery('');
      setSendMessage('');
      setShareNetworkSuccess(false);
    }, 1500);
    setSendingRec(false);
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const pendingInbox = inbox.filter(r => r.status === 'pending');
  const respondedInbox = inbox.filter(r => r.status !== 'pending');

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Gift className="w-16 h-16 text-gold/50 mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Recommendations</h1>
        <p className="text-ink-muted mb-6">Sign in to see your book recommendations</p>
        <Link href="/login" className="px-6 py-2.5 rounded-xl text-sm font-medium text-parchment" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-parchment/80 backdrop-blur-md px-4 py-4 border-b border-gold-light/20"
      >
        <div className="md:max-w-2xl md:mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              <Gift className="w-6 h-6 text-gold" />
              Recommendations
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">Give & receive book recommendations</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-parchment"
            style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
          >
            <Send className="w-4 h-4" /> Send
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="px-4 pt-4 md:max-w-2xl md:mx-auto">
        <div className="flex gap-1 glass-card rounded-xl p-1 mb-6" style={{ boxShadow: 'var(--th-card-shadow)' }}>
          {([
            { key: 'inbox' as TabType, icon: Inbox, label: 'Inbox', badge: pendingInbox.length },
            { key: 'sent' as TabType, icon: Send, label: 'Sent', badge: 0 },
            { key: 'discover' as TabType, icon: Sparkles, label: 'For You', badge: 0 },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
              style={activeTab === tab.key
                ? { background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))', color: 'var(--th-parchment)' }
                : { color: 'var(--th-ink-muted)' }
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-parchment" style={{ background: 'var(--th-rose)' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:max-w-2xl md:mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <>
            {/* ── Inbox Tab ── */}
            {activeTab === 'inbox' && (
              <div>
                {pendingInbox.length === 0 && respondedInbox.length === 0 ? (
                  <div className="text-center py-16">
                    <Inbox className="w-14 h-14 text-gold/30 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No recommendations yet</h2>
                    <p className="text-sm text-ink-muted">When someone recommends a book to you, it&apos;ll appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pending */}
                    {pendingInbox.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">New ({pendingInbox.length})</h3>
                        <div className="space-y-3">
                          {pendingInbox.map((rec) => (
                            <motion.div
                              key={rec.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="glass-card rounded-xl p-4"
                              style={{ borderLeft: '4px solid var(--th-forest)' }}
                            >
                              <div className="flex items-start gap-3">
                                {(rec.from_user as any)?.avatar_url ? (
                                  <img src={(rec.from_user as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-parchment text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-teal))' }}>
                                    {((rec.from_user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-ink">{(rec.from_user as any)?.reader_name || 'Someone'}</span>
                                    <span className="text-[10px] text-ink-muted">{formatTime(rec.created_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="w-4 h-4 text-forest flex-shrink-0" />
                                    <span className="text-sm font-semibold text-ink">{rec.book_title}</span>
                                    {rec.book_author && <span className="text-xs text-ink-muted">by {rec.book_author}</span>}
                                  </div>
                                  {rec.message && (
                                    <p className="text-xs text-ink-muted italic bg-cream/40 rounded-lg px-3 py-2 mt-1">
                                      &ldquo;{rec.message}&rdquo;
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-3">
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleAccept(rec)}
                                      disabled={accepting === rec.id}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-parchment"
                                      style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-teal))' }}
                                    >
                                      {accepting === rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                      Add to TBR
                                    </motion.button>
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDismiss(rec)}
                                      disabled={dismissing === rec.id}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                                    >
                                      {dismissing === rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                      Dismiss
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responded */}
                    {respondedInbox.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Past</h3>
                        <div className="space-y-2">
                          {respondedInbox.map((rec) => (
                            <div
                              key={rec.id}
                              className="glass-card rounded-xl p-3 flex items-center gap-3 opacity-60"
                            >
                              {(rec.from_user as any)?.avatar_url ? (
                                <img src={(rec.from_user as any).avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-parchment text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))' }}>
                                  {((rec.from_user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-ink">{rec.book_title}</span>
                                <span className="text-[10px] text-ink-muted ml-1">from {(rec.from_user as any)?.reader_name}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                rec.status === 'accepted'
                                  ? 'bg-forest/10 text-forest border border-forest/20'
                                  : 'bg-cream text-ink-muted border border-gold-light/20'
                              }`}>
                                {rec.status === 'accepted' ? 'Added' : 'Passed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Sent Tab ── */}
            {activeTab === 'sent' && (
              <div>
                {sent.length === 0 ? (
                  <div className="text-center py-16">
                    <Send className="w-14 h-14 text-gold/30 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No sent recommendations</h2>
                    <p className="text-sm text-ink-muted mb-4">Recommend a book to a friend!</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSendModal(true)}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium text-parchment"
                      style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                    >
                      Send a Recommendation
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sent.map((rec) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-4 flex items-center gap-3"
                      >
                        {(rec.to_user as any)?.avatar_url ? (
                          <img src={(rec.to_user as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-parchment text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))' }}>
                            {((rec.to_user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink">
                            <BookOpen className="w-3.5 h-3.5 inline mr-1 text-gold" />
                            <span className="font-medium">{rec.book_title}</span>
                          </div>
                          <div className="text-xs text-ink-muted mt-0.5">
                            to {(rec.to_user as any)?.reader_name || 'someone'} · {formatTime(rec.created_at)}
                          </div>
                          {rec.message && (
                            <p className="text-[11px] text-ink-muted italic mt-1 truncate">&ldquo;{rec.message}&rdquo;</p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                          rec.status === 'accepted' ? 'bg-forest/10 text-forest border border-forest/20'
                          : rec.status === 'dismissed' ? 'bg-rose/10 text-rose border border-rose/20'
                          : 'bg-amber/10 text-amber border border-amber/20'
                        }`}>
                          {rec.status === 'accepted' ? 'Accepted' : rec.status === 'dismissed' ? 'Dismissed' : 'Pending'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── For You (Auto-Recs) Tab ── */}
            {activeTab === 'discover' && (
              <div>
                {!autoRecsUnlocked ? (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-4">
                      <Lock className="w-14 h-14 text-gold/30" />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber/20 flex items-center justify-center border border-amber/30">
                        <Trophy className="w-4 h-4 text-amber" />
                      </div>
                    </div>
                    <h2 className="text-lg font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Unlock Personalized Picks
                    </h2>
                    <p className="text-sm text-ink-muted mb-4 max-w-xs mx-auto">
                      Complete <strong className="text-ink">{5 - completedBooks.length} more book{5 - completedBooks.length !== 1 ? 's' : ''}</strong> to unlock AI-powered recommendations tailored to your taste.
                    </p>
                    {/* Progress bar */}
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between text-xs text-ink-muted mb-1">
                        <span>{completedBooks.length} / 5 books completed</span>
                        <span>{Math.round((completedBooks.length / 5) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-cream rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedBooks.length / 5) * 100}%` }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, var(--th-gold), var(--th-amber))' }}
                        />
                      </div>
                    </div>

                    {/* Taste preview */}
                    {completedBooks.length > 0 && (
                      <div className="mt-6 glass-card rounded-xl p-4 text-left max-w-xs mx-auto">
                        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Your taste so far</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {tasteProfile.topGenres.map(g => (
                            <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/10 text-gold-dark border border-gold/15">{g}</span>
                          ))}
                          {tasteProfile.topAuthors.slice(0, 2).map(a => (
                            <span key={a} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-forest/10 text-forest border border-forest/15">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Taste Profile Card */}
                    <div className="glass-card rounded-xl p-4 mb-6" style={{ borderLeft: '4px solid var(--th-gold)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-gold" /> Your Taste Profile
                        </h3>
                        <span className="text-[10px] text-ink-muted">{completedBooks.length} books read</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tasteProfile.topGenres.map(g => (
                          <span key={g} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/10 text-gold-dark border border-gold/15">{g}</span>
                        ))}
                        {tasteProfile.topAuthors.slice(0, 3).map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-forest/10 text-forest border border-forest/15">{a}</span>
                        ))}
                      </div>
                    </div>

                    {/* Generate button */}
                    {!autoRecsGenerated && (
                      <div className="text-center mb-6">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={generateAutoRecs}
                          disabled={autoRecsLoading}
                          className="px-6 py-3 rounded-xl text-sm font-medium text-parchment flex items-center gap-2 mx-auto"
                          style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                        >
                          {autoRecsLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Finding books for you...</>
                          ) : (
                            <><Sparkles className="w-4 h-4" /> Generate Recommendations</>
                          )}
                        </motion.button>
                      </div>
                    )}

                    {/* Auto-rec loading skeleton */}
                    {autoRecsLoading && (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                            <div className="flex gap-3">
                              <div className="w-16 h-24 rounded-lg bg-gold-light/20" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gold-light/20 rounded w-3/4" />
                                <div className="h-3 bg-gold-light/20 rounded w-1/2" />
                                <div className="h-3 bg-gold-light/20 rounded w-2/3" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Auto-rec results */}
                    {autoRecsGenerated && !autoRecsLoading && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Picked for you</h3>
                          <button
                            onClick={generateAutoRecs}
                            className="flex items-center gap-1 text-xs text-gold-dark hover:text-gold transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                          </button>
                        </div>

                        {autoRecs.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-ink-muted">No new recommendations found. Try refreshing!</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {autoRecs.map((rec, i) => (
                              <motion.div
                                key={`${rec.title}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card rounded-xl p-4"
                              >
                                <div className="flex gap-3">
                                  {rec.coverUrl ? (
                                    <img src={rec.coverUrl} alt={rec.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                                  ) : (
                                    <div className="w-16 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--th-gold-light), var(--th-amber))' }}>
                                      <BookOpen className="w-6 h-6 text-parchment/60" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-ink line-clamp-1">{rec.title}</h4>
                                    <p className="text-xs text-ink-muted">{rec.author}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Sparkles className="w-3 h-3 text-gold" />
                                      <span className="text-[11px] text-gold-dark italic">{rec.reason}</span>
                                    </div>
                                    {rec.genre && (
                                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] bg-cream text-ink-muted border border-gold-light/20">{rec.genre}</span>
                                    )}
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleAddAutoRecToTBR(rec)}
                                      className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-parchment"
                                      style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-teal))' }}
                                    >
                                      <Check className="w-3 h-3" /> Add to TBR
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Send Recommendation Modal */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSendModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-parchment rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gold-light/30 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                <Gift className="w-5 h-5 inline mr-2 text-gold" />
                Recommend a Book
              </h3>

              {sendSuccess || shareNetworkSuccess ? (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-forest mx-auto mb-2" />
                  <p className="text-sm font-medium text-forest">
                    {shareNetworkSuccess ? 'Shared with your network!' : 'Recommendation sent!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step 1: Choose a book */}
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                      1. Choose a book
                    </label>
                    {selectedBook ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-forest/10 border border-forest/20">
                        {selectedBook.coverUrl && (
                          <img src={selectedBook.coverUrl} alt="" className="w-8 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink line-clamp-1">{selectedBook.title}</p>
                          <p className="text-xs text-ink-muted">{selectedBook.author}</p>
                        </div>
                        <button onClick={() => { setSelectedBook(null); setSendBookQuery(''); }} className="text-ink-muted hover:text-ink">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                          <input
                            type="text"
                            value={sendBookQuery}
                            onChange={(e) => setSendBookQuery(e.target.value)}
                            placeholder="Search for a book..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                          />
                          {sendBookSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />}
                        </div>
                        {sendBookResults.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {sendBookResults.map((b, i) => (
                              <button
                                key={i}
                                onClick={() => { setSelectedBook(b); setSendBookQuery(''); setSendBookResults([]); }}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream/40 transition-colors"
                              >
                                {b.coverUrl ? (
                                  <img src={b.coverUrl} alt="" className="w-6 h-9 object-cover rounded" />
                                ) : (
                                  <div className="w-6 h-9 rounded bg-gold-light/20 flex items-center justify-center">
                                    <BookOpen className="w-3 h-3 text-gold" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-ink line-clamp-1">{b.title}</p>
                                  <p className="text-[10px] text-ink-muted">{b.author}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Choose how to share */}
                  {selectedBook && (
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-2 uppercase tracking-wider">
                        2. How would you like to share?
                      </label>

                      {/* Share with Network option */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleShareWithNetwork}
                        disabled={sendingRec}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-3 bg-gradient-to-r from-gold/10 to-amber/5 border border-gold/20 hover:from-gold/20 hover:to-amber/10 transition-all text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-gold-dark" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">Share with Network</p>
                          <p className="text-[10px] text-ink-muted">Post to your activity feed for followers to see</p>
                        </div>
                        {sendingRec && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
                      </motion.button>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-px bg-gold-light/20" />
                        <span className="text-[10px] text-ink-muted uppercase">or send to a friend</span>
                        <div className="flex-1 h-px bg-gold-light/20" />
                      </div>

                      {/* Send to specific user */}
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                          <input
                            type="text"
                            value={sendUserQuery}
                            onChange={(e) => setSendUserQuery(e.target.value)}
                            placeholder="Search for a reader..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                          />
                        </div>
                        {sendUsers.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {sendUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleSendRec(u.id)}
                              disabled={sendingRec}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream/40 transition-colors"
                            >
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-parchment text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))' }}>
                                  {u.reader_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-ink">{u.reader_name}</p>
                                <p className="text-[10px] text-ink-muted">@{u.public_slug}</p>
                              </div>
                              <Send className="w-4 h-4 text-gold" />
                            </button>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  )}

                  {/* Optional message */}
                  {selectedBook && (
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        3. Add a note (optional)
                      </label>
                      <input
                        type="text"
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        placeholder="I think you'd love this because..."
                        className="w-full px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => setShowSendModal(false)}
                    className="w-full px-4 py-2 rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
