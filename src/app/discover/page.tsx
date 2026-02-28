'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  BookOpen,
  Trophy,
  Star,
  Loader2,
  User,
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

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load featured/recent public profiles on mount
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchPublicProfiles = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (data) {
        setUsers(data as PublicUser[]);
      }
      setLoading(false);
    };

    fetchPublicProfiles();
  }, []);

  // Search when query changes (debounced)
  useEffect(() => {
    if (!query.trim()) {
      // Reset to all public profiles
      const fetchAll = async () => {
        if (!isSupabaseConfigured()) return;
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
          .eq('shelf_public', true)
          .not('public_slug', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(20);
        if (data) setUsers(data as PublicUser[]);
      };
      fetchAll();
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .or(`reader_name.ilike.%${query}%,public_slug.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('reader_name')
        .limit(20);

      if (data) {
        setUsers(data as PublicUser[]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getStats = (user: PublicUser) => {
    const books = user.reading_data?.books || [];
    const completed = books.filter((b) => b.status === 'completed').length;
    const avgRating =
      books.filter((b) => b.rating).length > 0
        ? books.reduce((sum, b) => sum + (b.rating || 0), 0) /
          books.filter((b) => b.rating).length
        : 0;
    return { total: books.length, completed, avgRating };
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-parchment/80 backdrop-blur-md px-4 py-4 border-b border-gold-light/20"
      >
        <h1
          className="text-2xl font-bold text-ink mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Users className="w-6 h-6 text-gold" />
          Discover Readers
        </h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold transition-colors"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold animate-spin" />
          )}
        </div>
      </motion.div>

      {/* Results */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <p className="text-ink-muted">
              {query ? 'No readers found matching your search' : 'No public profiles yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => {
                const stats = getStats(user);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/user/${user.public_slug}`}
                      className="block glass-card rounded-xl p-4 hover:shadow-lg transition-shadow group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.reader_name}
                            className="w-14 h-14 rounded-full object-cover group-hover:ring-2 group-hover:ring-gold transition-all"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold group-hover:ring-2 group-hover:ring-gold transition-all"
                            style={{
                              background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                              color: 'var(--th-parchment)',
                            }}
                          >
                            {(user.reader_name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base font-semibold text-ink truncate group-hover:text-gold transition-colors">
                            {user.reader_name}
                          </h2>
                          <p className="text-xs text-ink-muted">@{user.public_slug}</p>
                          {user.bio && (
                            <p
                              className="text-sm text-ink-muted mt-1 line-clamp-2"
                              style={{ fontFamily: "'Lora', Georgia, serif" }}
                            >
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gold-light/20">
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <BookOpen className="w-3.5 h-3.5 text-gold" />
                          <span>{stats.total} books</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Trophy className="w-3.5 h-3.5 text-forest" />
                          <span>{stats.completed} read</span>
                        </div>
                        {stats.avgRating > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                            <span>{stats.avgRating.toFixed(1)}</span>
                          </div>
                        )}
                        {user.favorite_genre && (
                          <div className="ml-auto text-xs text-ink-muted bg-gold-light/20 px-2 py-0.5 rounded-full">
                            {user.favorite_genre}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
