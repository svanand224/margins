'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Loader2,
  Check,
  X,
  BookOpen,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
  message: string | null;
  status: string;
  created_at: string;
  from_user: {
    id: string;
    reader_name: string;
    avatar_url: string | null;
    public_slug: string | null;
  };
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }
      if (!user) {
        setError('You must be logged in to view your recommendations.');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      let query = supabase
        .from('recommendations')
        .select(`
          id,
          book_title,
          book_author,
          book_cover_url,
          message,
          status,
          created_at,
          from_user:from_user_id (
            id,
            reader_name,
            avatar_url,
            public_slug
          )
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data } = await query.limit(50);

      if (data) {
        setRecommendations(data as unknown as Recommendation[]);
      }

      setLoading(false);
    };

    fetchRecommendations();
  }, [user, filter]);

  const handleAccept = async (rec: Recommendation) => {
    const supabase = createClient();

    await supabase
      .from('recommendations')
      .update({ status: 'accepted' })
      .eq('id', rec.id);

    setRecommendations(
      recommendations.map((r) =>
        r.id === rec.id ? { ...r, status: 'accepted' } : r
      )
    );
  };

  const handleDismiss = async (id: string) => {
    const supabase = createClient();

    await supabase
      .from('recommendations')
      .update({ status: 'dismissed' })
      .eq('id', id);

    setRecommendations(
      recommendations.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' } : r
      )
    );
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Gift className="w-16 h-16 text-gold/50 mb-4" />
        <h1
          className="text-2xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Sign In to See Recommendations
        </h1>
        <p className="text-ink-muted mb-6">Get personalized book suggestions from friends</p>
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl text-sm font-medium text-parchment"
          style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
        >
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
        <h1
          className="text-2xl font-bold text-ink flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Gift className="w-6 h-6 text-forest" />
          Book Recommendations
        </h1>
        <p className="text-sm text-ink-muted mt-1">Books suggested by other readers</p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-forest text-parchment'
                : 'bg-cream/50 text-ink hover:bg-cream'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-forest text-parchment'
                : 'bg-cream/50 text-ink hover:bg-cream'
            }`}
          >
            All
          </button>
        </div>
      </motion.div>

      {/* Recommendations */}
      <div className="px-4 py-6 md:max-w-2xl md:mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <h2
              className="text-xl font-bold text-ink mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              No recommendations yet
            </h2>
            <p className="text-ink-muted mb-6">
              {filter === 'pending'
                ? 'No pending recommendations'
                : 'Ask friends to recommend books!'}
            </p>
            <Link
              href="/discover"
              className="inline-block px-6 py-3 rounded-xl text-sm font-medium text-parchment"
              style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
            >
              Find Readers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card rounded-xl p-4 ${
                    rec.status !== 'pending' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    {rec.book_cover_url ? (
                      <img
                        src={rec.book_cover_url}
                        alt={rec.book_title}
                        className="w-20 h-28 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-gold/50" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-ink line-clamp-1"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {rec.book_title}
                      </h3>
                      {rec.book_author && (
                        <p className="text-sm text-ink-muted">{rec.book_author}</p>
                      )}

                      {/* From */}
                      <div className="flex items-center gap-2 mt-2">
                        {rec.from_user && rec.from_user.public_slug ? (
                          <Link
                            href={`/user/${rec.from_user.public_slug}`}
                            className="flex items-center gap-2 group"
                          >
                            {rec.from_user.avatar_url ? (
                              <img
                                src={rec.from_user.avatar_url}
                                alt={rec.from_user.reader_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                                }}
                              >
                                {(rec.from_user.reader_name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-ink group-hover:text-gold transition-colors">
                              {rec.from_user.reader_name}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-ink">
                            {rec.from_user?.reader_name ?? 'Unknown User'}
                          </span>
                        )}

                      {/* Actions */}
                      {rec.status === 'pending' ? (
                        <div className="flex gap-2 mt-3">
                          <Link
                            href={`/add?title=${encodeURIComponent(rec.book_title)}${rec.book_author ? `&author=${encodeURIComponent(rec.book_author)}` : ''}`}
                            onClick={() => handleAccept(rec)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium text-parchment flex items-center justify-center gap-1 bg-forest"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add to Library
                          </Link>
                          <button
                            onClick={() => handleDismiss(rec.id)}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-cream/50 text-ink-muted hover:bg-cream transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-1 text-xs text-ink-muted">
                          {rec.status === 'accepted' ? (
                            <>
                              <Check className="w-3 h-3 text-forest" />
                              Added to library
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              Dismissed
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
