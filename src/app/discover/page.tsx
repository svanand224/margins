'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  BookOpen,
  Trophy,
  Star,
  Loader2,
  User,
  Compass,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

interface PublicUser {
  id: string;
  reader_name: string;
  avatar_url: string | null;
  bio: string;
  favorite_genre: string;
  public_slug: string;
  reading_data: {
    books?: Book[];
  };
}

interface RecentActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, unknown>;
  created_at: string;
  user?: { reader_name: string; avatar_url: string | null; public_slug: string };
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<PublicUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'explore' | 'search'>('explore');

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const supabase = createClient();

    // Fetch all public profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
      .eq('shelf_public', true)
      .not('public_slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (profiles) {
      setUsers(profiles as PublicUser[]);
      // Featured = those with most books
      const sorted = [...(profiles as PublicUser[])].sort((a, b) => {
        const aBooks = a.reading_data?.books?.length || 0;
        const bBooks = b.reading_data?.books?.length || 0;
        return bBooks - aBooks;
      });
      setFeaturedUsers(sorted.slice(0, 6));
    }

    // Fetch recent public activity
    const { data: activities } = await supabase
      .from('activities')
      .select('*, user:user_id(reader_name, avatar_url, public_slug)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (activities) setRecentActivity(activities as unknown as RecentActivity[]);

    setLoading(false);
  };

  // Search
  useEffect(() => {
    if (tab !== 'search' || !query.trim()) return;
    setSearching(true);
    const timeout = setTimeout(async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .or(`reader_name.ilike.%${query}%,public_slug.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(20);
      setUsers(data as PublicUser[] || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, tab]);

  const getStats = (user: PublicUser) => {
    const books = user.reading_data?.books || [];
    const completed = books.filter((b) => b.status === 'completed').length;
    return { total: books.length, completed };
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityText = (activity: RecentActivity) => {
    const data = activity.activity_data as Record<string, string>;
    switch (activity.activity_type) {
      case 'book_added': return `added "${data.book_title || 'a book'}" to their library`;
      case 'book_completed': return `finished reading "${data.book_title || 'a book'}"`;
      case 'review_added': return `reviewed "${data.book_title || 'a book'}"`;
      case 'follow': return `followed ${data.followed_name || 'someone'}`;
      default: return 'was active';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
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
        <div className="md:max-w-3xl md:mx-auto">
          <h1
            className="text-2xl font-bold text-ink flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Compass className="w-6 h-6 text-gold" />
            Explore
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">Discover readers, libraries & conversations</p>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setTab('search');
                else setTab('explore');
              }}
              placeholder="Search readers by name, handle, or bio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gold-light/30 bg-cream/50 text-ink text-sm placeholder:text-ink-muted/60 focus:outline-none focus:border-gold transition-colors"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gold" />}
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-6 md:max-w-3xl md:mx-auto">
        {tab === 'search' ? (
          /* Search results */
          <div>
            <p className="text-xs text-ink-muted mb-4">{users.length} result{users.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
            {users.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                <p className="text-ink-muted text-sm">No readers found. Try a different search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u, i) => {
                  const stats = getStats(u);
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        href={`/user/${u.public_slug}`}
                        className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-cream/40 transition-colors group"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment font-bold">
                            {u.reader_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-ink group-hover:text-gold-dark transition-colors">{u.reader_name}</h3>
                          <p className="text-xs text-ink-muted">@{u.public_slug}</p>
                          {u.bio && <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{u.bio}</p>}
                        </div>
                        <div className="text-right text-xs text-ink-muted flex-shrink-0">
                          <p>{stats.total} books</p>
                          <p>{stats.completed} read</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-muted/30 flex-shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Explore view */
          <div className="space-y-8">
            {/* Featured Libraries */}
            {featuredUsers.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold" /> Featured Libraries
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featuredUsers.map((u, i) => {
                    const stats = getStats(u);
                    const currentlyReading = u.reading_data?.books?.find(b => b.status === 'reading');
                    return (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Link
                          href={`/shelf/${u.public_slug}`}
                          className="glass-card rounded-xl p-4 hover:bg-cream/40 transition-colors group block text-center"
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-gold-light/30 group-hover:ring-gold transition-all" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment font-bold text-lg mx-auto ring-2 ring-gold-light/30 group-hover:ring-gold transition-all">
                              {u.reader_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="text-sm font-semibold text-ink mt-2 truncate group-hover:text-gold-dark transition-colors">{u.reader_name}</h3>
                          <p className="text-[10px] text-ink-muted">{stats.total} books · {stats.completed} read</p>
                          {currentlyReading && (
                            <p className="text-[10px] text-gold-dark mt-1 truncate flex items-center justify-center gap-1">
                              <BookOpen className="w-3 h-3" /> {currentlyReading.title}
                            </p>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gold" /> Recent Activity
                </h2>
                <div className="glass-card rounded-xl divide-y divide-gold-light/15">
                  {recentActivity.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      {(activity.user as any)?.avatar_url ? (
                        <img src={(activity.user as any).avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment text-xs font-bold flex-shrink-0">
                          {((activity.user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink">
                          <Link
                            href={`/user/${(activity.user as any)?.public_slug || ''}`}
                            className="font-medium hover:text-gold-dark transition-colors"
                          >
                            {(activity.user as any)?.reader_name || 'Someone'}
                          </Link>{' '}
                          <span className="text-ink-muted">{getActivityText(activity)}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-ink-muted flex-shrink-0">{formatTime(activity.created_at)}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* All Readers */}
            <section>
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gold" /> All Readers
              </h2>
              <div className="space-y-3">
                {users.map((u, i) => {
                  const stats = getStats(u);
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        href={`/user/${u.public_slug}`}
                        className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-cream/40 transition-colors group"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment font-bold">
                            {u.reader_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-ink group-hover:text-gold-dark transition-colors">{u.reader_name}</h3>
                          <p className="text-xs text-ink-muted">@{u.public_slug}</p>
                        </div>
                        <div className="text-right text-xs text-ink-muted flex-shrink-0">
                          <p className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {stats.total}</p>
                          <p className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {stats.completed}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-muted/30 flex-shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
