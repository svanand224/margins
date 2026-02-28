'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Star,
  Trophy,
  UserPlus,
  Gift,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  user: {
    reader_name: string;
    avatar_url: string | null;
    public_slug: string | null;
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchFeed = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }
      if (!user) {
        setError('You must be logged in to view your feed.');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Get users I follow
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get activities from followed users
      const { data: activitiesData } = await supabase
        .from('activities')
        .select(`
          id,
          user_id,
          type,
          data,
          created_at,
          user:user_id (
            reader_name,
            avatar_url,
            public_slug
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesData) {
        setActivities(activitiesData as unknown as Activity[]);
      }

      setLoading(false);
    };

    fetchFeed();
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'started_reading':
        return <BookOpen className="w-4 h-4 text-amber" />;
      case 'finished_book':
        return <Trophy className="w-4 h-4 text-forest" />;
      case 'rated_book':
        return <Star className="w-4 h-4 text-gold fill-gold" />;
      case 'followed':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'recommended':
        return <Gift className="w-4 h-4 text-forest" />;
      default:
        return <Sparkles className="w-4 h-4 text-gold" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const data = activity.data as Record<string, string>;
    switch (activity.type) {
      case 'started_reading':
        return (
          <>
            started reading <strong>{data.book_title}</strong>
          </>
        );
      case 'finished_book':
        return (
          <>
            finished <strong>{data.book_title}</strong>
          </>
        );
      case 'rated_book':
        return (
          <>
            rated <strong>{data.book_title}</strong> {data.rating}/5 stars
          </>
        );
      case 'followed':
        return (
          <>
            started following{' '}
            {data.following_slug ? (
              <Link href={`/user/${data.following_slug}`} className="font-semibold hover:text-gold">
                {data.following_name}
              </Link>
            ) : (
              <strong>{data.following_name}</strong>
            )}
          </>
        );
      case 'recommended':
        return (
          <>
            recommended <strong>{data.book_title}</strong> to someone
          </>
        );
      default:
        return <>did something</>;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Sparkles className="w-16 h-16 text-gold/50 mb-4" />
        <h1
          className="text-2xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Sign In to See Your Feed
        </h1>
        <p className="text-ink-muted mb-6">Follow readers to see their activity here</p>
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
          <Sparkles className="w-6 h-6 text-gold" />
          Activity Feed
        </h1>
        <p className="text-sm text-ink-muted mt-1">See what readers you follow are up to</p>
      </motion.div>

      {/* Feed */}
      <div className="px-4 py-6 md:max-w-2xl md:mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <h2
              className="text-xl font-bold text-ink mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Your feed is empty
            </h2>
            <p className="text-ink-muted mb-6">
              Follow some readers to see their activity here
            </p>
            <Link
              href="/discover"
              className="inline-block px-6 py-3 rounded-xl text-sm font-medium text-parchment"
              style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
            >
              Discover Readers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    {activity.user && activity.user.public_slug ? (
                      <Link href={`/user/${activity.user.public_slug}`}>
                        {activity.user.avatar_url ? (
                          <img
                            src={activity.user.avatar_url}
                            alt={activity.user.reader_name}
                            className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-gold transition-all"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold hover:ring-2 hover:ring-gold transition-all"
                            style={{
                              background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                              color: 'var(--th-parchment)',
                            }}
                          >
                            {(activity.user.reader_name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                    ) : activity.user && activity.user.avatar_url ? (
                      <img
                        src={activity.user.avatar_url}
                        alt={activity.user.reader_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                          color: 'var(--th-parchment)',
                        }}
                      >
                        {(activity.user?.reader_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          {activity.user && activity.user.public_slug ? (
                            <Link
                              href={`/user/${activity.user.public_slug}`}
                              className="font-semibold text-ink hover:text-gold transition-colors"
                            >
                              {activity.user.reader_name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-ink">{activity.user?.reader_name ?? 'Unknown User'}</span>
                          )}
                          <p className="text-sm text-ink-muted" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                            {getActivityText(activity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                          {getActivityIcon(activity.type)}
                          <span>{formatTime(activity.created_at)}</span>
                        </div>
                      </div>

                      {/* Book cover for book activities */}
                      {(activity.data as Record<string, string>).book_cover && (
                        <div className="mt-3">
                          <img
                            src={(activity.data as Record<string, string>).book_cover}
                            alt={(activity.data as Record<string, string>).book_title}
                            className="w-16 h-24 object-cover rounded-lg shadow-sm"
                          />
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
