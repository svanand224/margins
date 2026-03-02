'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import * as Lucide from 'lucide-react';
import {
  BookOpen,
  BookMarked,
  Library,
  Star,
  Clock,
  Trophy,
  Loader2,
  ArrowLeft,
  Check,
  Gift,
  UserPlus,
  Edit3,
} from 'lucide-react';
import { Book } from '@/lib/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ProfileBadge {
  id: string;
  type: string;
  label: string;
  rank?: number;
  week?: string;
  from_user_name?: string;
  from_user_id?: string;
  awarded_at: string;
}

interface PublicProfile {
  id: string;
  username: string;
  reader_name: string;
  avatar_url: string | null;
  bio: string;
  favorite_genre: string;
  public_slug: string;
  shelf_public: boolean;
  shelf_accent_color: string;
  shelf_show_currently_reading: boolean;
  shelf_show_stats: boolean;
  shelf_bio_override: string | null;
  badges: ProfileBadge[];
  reading_data: {
    books?: Book[];
    goals?: { pagesPerDay?: number; booksPerYear?: number };
    dailyLogs?: Record<string, { pagesRead: number; minutesRead: number }>;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendSuccess, setRecommendSuccess] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendBook, setRecommendBook] = useState({ title: '', author: '', message: '' });

  // Follow request state
  const [followRequestStatus, setFollowRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isAcceptedFollower, setIsAcceptedFollower] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isSupabaseConfigured()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // If not logged in, only fetch minimal profile info (no reading data)
      if (!user) {
        const { data: minimalProfile, error: minimalError } = await supabase
          .from('profiles')
          .select('id, reader_name, avatar_url, public_slug')
          .eq('public_slug', slug)
          .single();

        if (minimalError || !minimalProfile) {
          setNotFound(true);
        } else {
          setProfile({
            ...minimalProfile,
            username: '',
            bio: '',
            favorite_genre: '',
            shelf_public: false,
            shelf_accent_color: 'gold',
            shelf_show_currently_reading: false,
            shelf_show_stats: false,
            shelf_bio_override: null,
            badges: [],
            reading_data: { books: [], goals: {}, dailyLogs: {} },
          } as PublicProfile);
        }
        setLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, username, reader_name, avatar_url, bio, favorite_genre, public_slug, shelf_public, shelf_accent_color, shelf_show_currently_reading, shelf_show_stats, shelf_bio_override, badges, reading_data, created_at')
        .eq('public_slug', slug)
        .single();

      // Normalize badges
      if (profileData) {
        (profileData as any).badges = Array.isArray((profileData as any).badges) ? (profileData as any).badges : [];
      }

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check follow status, follow requests, and determine visibility
      let canSeeContent = profileData.shelf_public;

      {
        // Check if already following
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();
        setIsFollowing(!!followData);

        // If following a private profile, they can see content
        if (followData && !profileData.shelf_public) {
          canSeeContent = true;
          setIsAcceptedFollower(true);
        }

        // Check follow request status (for private profiles)
        if (!profileData.shelf_public && !followData) {
          const { data: requestData } = await supabase
            .from('follow_requests')
            .select('status')
            .eq('requester_id', user.id)
            .eq('target_id', profileData.id)
            .maybeSingle();
          if (requestData) {
            setFollowRequestStatus(requestData.status as any);
            if (requestData.status === 'accepted') {
              canSeeContent = true;
              setIsAcceptedFollower(true);
            }
          }
        }
      }

      // For private profiles where viewer can't see content, strip reading data
      if (!canSeeContent) {
        profileData.reading_data = { books: [], goals: {}, dailyLogs: {} };
        profileData.shelf_show_currently_reading = false;
        profileData.shelf_show_stats = false;
      }

      setProfile(profileData as PublicProfile);
      setLoading(false);

      // Get follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);
      setFollowerCount(followers || 0);
      // Get following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);
      setFollowingCount(following || 0);
    };

    fetchProfile();
  }, [slug, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    try {
      const supabase = createClient();

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        if (!error) {
          setIsFollowing(false);
          setFollowerCount(c => Math.max(0, c - 1));
          setIsAcceptedFollower(false);
          // Also clear any follow_request so re-following a private profile requires re-approval
          await supabase
            .from('follow_requests')
            .delete()
            .eq('requester_id', user.id)
            .eq('target_id', profile.id);
          setFollowRequestStatus('none');
        }
      } else if (!profile.shelf_public && followRequestStatus === 'none') {
        // Private profile — send follow request
        const { error } = await supabase.from('follow_requests').insert({
          requester_id: user.id,
          target_id: profile.id,
        });
        if (!error) {
          setFollowRequestStatus('pending');
          // Send notification
          await supabase.from('notifications').insert({
            user_id: profile.id,
            type: 'follow_request',
            from_user_id: user.id,
            data: {},
          });
        }
      } else if (!profile.shelf_public && followRequestStatus === 'pending') {
        // Cancel pending request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', user.id)
          .eq('target_id', profile.id);
        if (!error) {
          setFollowRequestStatus('none');
        }
      } else {
        // Public profile — follow directly
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profile.id,
        });
        if (!error) {
          setIsFollowing(true);
          setFollowerCount(c => c + 1);
          // Log activity (non-blocking)
          supabase.from('activities').insert({
            user_id: user.id,
            type: 'followed',
            data: { following_name: profile.reader_name, following_slug: profile.public_slug },
          }).then(() => {});
          // Send notification to the followed user
          supabase.from('notifications').insert({
            user_id: profile.id,
            type: 'new_follower',
            from_user_id: user.id,
            data: {},
          }).then(() => {});
        } else {
          console.error('Follow error:', error.message);
        }
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
    setFollowLoading(false);
  };

  const handleRecommendBook = async () => {
    if (!user || !profile || !recommendBook.title.trim()) return;
    setRecommendLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from('recommendations').insert({
      from_user_id: user.id,
      to_user_id: profile.id,
      book_title: recommendBook.title.trim(),
      book_author: recommendBook.author.trim() || null,
      message: recommendBook.message.trim() || null,
    });

    if (!error) {
      setRecommendSuccess(true);
      // Send notification to the recommended user
      supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'new_recommendation',
        from_user_id: user.id,
        data: { book_title: recommendBook.title.trim() },
      }).then(() => {});
      setTimeout(() => {
        setShowRecommendModal(false);
        setRecommendBook({ title: '', author: '', message: '' });
        setRecommendSuccess(false);
      }, 1500);
    }

    setRecommendLoading(false);
  };

  const books: Book[] = profile?.reading_data?.books || [];
  const completedBooks: Book[] = books.filter((b: Book) => b.status === 'completed');
  const currentlyReading: Book[] = books.filter((b: Book) => b.status === 'reading');
  const wantToRead: Book[] = books.filter((b: Book) => b.status === 'want-to-read');
  const totalPages: number = completedBooks.reduce((sum: number, b: Book) => sum + (b.totalPages || 0), 0);
  const avgRating: number =
    completedBooks.filter((b: Book) => b.rating).length > 0
      ? completedBooks.reduce((sum: number, b: Book) => sum + (b.rating || 0), 0) /
        completedBooks.filter((b: Book) => b.rating).length
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <BookOpen className="w-16 h-16 text-gold/50 mb-4" />
        <h1
          className="text-2xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Profile Not Found
        </h1>
        <p className="text-ink-muted mb-6">
          This profile does not exist or the link is incorrect.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 text-gold hover:text-gold-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    );
  }

  // Gate: unauthenticated visitors must sign up to view any profile
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))',
              color: 'var(--th-parchment)',
            }}
          >
            {(profile.reader_name || 'U').charAt(0).toUpperCase()}
          </div>
          <h1
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {profile.reader_name} is on Margins
          </h1>
          <p className="text-sm text-ink-muted mb-6">
            Create an account to view their profile, see what they&#39;re reading, and connect with readers.
          </p>
          <Link href="/login">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full px-6 py-3 rounded-xl text-base font-semibold text-parchment shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
            >
              <UserPlus className="w-5 h-5" />
              Sign up to view profile
            </motion.button>
          </Link>
          <Link href="/login" className="block mt-3 text-sm text-gold hover:text-gold-dark transition-colors">
            Already have an account? Log in
          </Link>
        </motion.div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  // Resolve accent color to CSS values
  const accentThemes: Record<string, { accent: string; accentLight: string }> = {
    gold: { accent: 'var(--th-gold)', accentLight: 'var(--th-gold-light)' },
    teal: { accent: '#0d9488', accentLight: '#99f6e4' },
    rose: { accent: '#e11d48', accentLight: '#fecdd3' },
    forest: { accent: '#059669', accentLight: '#a7f3d0' },
    purple: { accent: '#7c3aed', accentLight: '#ddd6fe' },
    copper: { accent: '#c2410c', accentLight: '#fed7aa' },
  };
  const accent = accentThemes[profile.shelf_accent_color || 'gold'] || accentThemes.gold;
  const displayBio = profile.shelf_bio_override || profile.bio;
  const showCurrentlyReading = profile.shelf_show_currently_reading !== false;
  const showStats = profile.shelf_show_stats !== false;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card mx-4 mt-4 rounded-2xl p-6 md:mx-auto md:max-w-2xl lg:max-w-4xl" style={{ borderTop: `3px solid ${accent.accent}` }}>
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.reader_name}
              className="w-20 h-20 rounded-full object-cover"
              style={{ boxShadow: `0 0 0 3px ${accent.accentLight}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${accent.accent}, ${accent.accentLight})`,
                color: 'var(--th-parchment)',
              }}
            >
              {(profile.reader_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-bold text-ink truncate"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {profile.reader_name}
            </h1>
            <p className="text-xs text-ink-muted mb-2">@{profile.username || profile.public_slug}</p>
            {displayBio && (
              <p className="text-sm text-ink-muted italic mb-3 line-clamp-2">{displayBio}</p>
            )}
            {/* Follow stats */}
            <div className="flex items-center gap-4 text-xs text-ink-muted mb-3">
              <span><strong className="text-ink">{followerCount}</strong> followers</span>
              <span><strong className="text-ink">{followingCount}</strong> following</span>
            </div>
            {/* Action buttons */}
            {!isOwnProfile && user && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isFollowing
                      ? 'bg-cream border border-gold-light/30 text-ink-muted hover:bg-rose/10 hover:text-rose hover:border-rose/30'
                      : followRequestStatus === 'pending'
                      ? 'bg-cream border border-gold-light/30 text-ink-muted hover:bg-rose/10 hover:text-rose hover:border-rose/30'
                      : 'text-parchment shadow-sm'
                  }`}
                  style={!isFollowing && followRequestStatus !== 'pending' ? { background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' } : undefined}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    'Following'
                  ) : followRequestStatus === 'pending' ? (
                    <><Lucide.Clock className="w-4 h-4" /> Requested</>
                  ) : !profile.shelf_public ? (
                    <><Lucide.Lock className="w-4 h-4" /> Request to Follow</>
                  ) : (
                    <><Lucide.UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRecommendModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-forest/10 text-forest border border-forest/20 hover:bg-forest/20 transition-colors flex items-center gap-1.5"
                >
                  <Lucide.Gift className="w-4 h-4" />
                  Recommend
                </motion.button>
              </div>
            )}

            {isOwnProfile && (
              <Link href="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-cream border border-gold-light/30 text-ink-muted hover:text-ink transition-colors">
                <Lucide.Edit3 className="w-4 h-4" /> Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        {showStats && (
        <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-gold-light/20">
          <div className="text-center">
            <Library className="w-4 h-4 mx-auto mb-1" style={{ color: accent.accent }} />
            <div className="text-lg font-bold text-ink">{books.length}</div>
            <div className="text-[10px] md:text-xs text-ink-muted">Books</div>
          </div>
          <div className="text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1" style={{ color: accent.accent }} />
            <div className="text-lg font-bold text-ink">{completedBooks.length}</div>
            <div className="text-[10px] md:text-xs text-ink-muted">Read</div>
          </div>
          <div className="text-center">
            <BookOpen className="w-4 h-4 mx-auto mb-1" style={{ color: accent.accent }} />
            <div className="text-lg font-bold text-ink">{totalPages.toLocaleString()}</div>
            <div className="text-[10px] md:text-xs text-ink-muted">Pages</div>
          </div>
          <div className="text-center">
            <Star className="w-4 h-4 mx-auto mb-1" style={{ color: accent.accent }} />
            <div className="text-lg font-bold text-ink">{avgRating.toFixed(1)}</div>
            <div className="text-[10px] md:text-xs text-ink-muted">Avg</div>
          </div>
        </div>
        )}
      </motion.section>

      {/* Recommend Modal */}
      {showRecommendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRecommendModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-parchment rounded-2xl shadow-2xl p-6 w-full max-w-sm sm:max-w-md border border-gold-light/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Recommend a Book to {profile.reader_name}
            </h3>
            {recommendSuccess ? (
              <div className="text-center py-4">
                <Lucide.Check className="w-10 h-10 text-forest mx-auto mb-2" />
                <p className="text-sm text-forest font-medium">Recommendation sent!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={recommendBook.title}
                  onChange={(e) => setRecommendBook(r => ({ ...r, title: e.target.value }))}
                  placeholder="Book title *"
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                />
                <input
                  type="text"
                  value={recommendBook.author}
                  onChange={(e) => setRecommendBook(r => ({ ...r, author: e.target.value }))}
                  placeholder="Author (optional)"
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                />
                <input
                  type="text"
                  value={recommendBook.message}
                  onChange={(e) => setRecommendBook(r => ({ ...r, message: e.target.value }))}
                  placeholder="Message (optional)"
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowRecommendModal(false)} className="flex-1 px-4 py-2 rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors">Cancel</button>
                  <button
                    onClick={handleRecommendBook}
                    disabled={!recommendBook.title.trim() || recommendLoading}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-parchment disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-teal))' }}
                  >
                    {recommendLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Private profile notice */}
      {!profile.shelf_public && !isOwnProfile && !isAcceptedFollower && !isFollowing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mx-4 mt-4 rounded-2xl p-5 md:mx-auto md:max-w-2xl lg:max-w-4xl border border-gold-light/20 text-center"
        >
          <Lucide.Lock className="w-8 h-8 mx-auto mb-2 text-gold/60" />
          <h3
            className="text-base font-semibold text-ink mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Private Reader
          </h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            {followRequestStatus === 'pending'
              ? `Your follow request is pending. Once ${profile.reader_name} accepts, you'll be able to see their reading activity.`
              : followRequestStatus === 'rejected'
              ? `${profile.reader_name} has not accepted your follow request.`
              : `${profile.reader_name} keeps their library private. Send a follow request to see their reading activity and recommendations.`
            }
          </p>
        </motion.div>
      )}

      {/* Badges & Achievements */}
      {profile.badges && profile.badges.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mx-4 mt-4 rounded-2xl p-5 md:mx-auto md:max-w-2xl lg:max-w-4xl"
        >
          <h2
            className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Lucide.Award className="w-5 h-5" style={{ color: accent.accent }} />
            Badges & Recognition
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* Top Reader badges */}
            {profile.badges.filter((b: ProfileBadge) => b.type === 'top_reader').map((badge: ProfileBadge) => (
              <div
                key={badge.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-xs font-medium text-gold-dark"
              >
                <Lucide.Crown className="w-3.5 h-3.5" />
                {badge.label}
                {badge.week && <span className="text-[10px] text-ink-muted ml-1">({badge.week})</span>}
              </div>
            ))}
            {/* Confetti badges */}
            {profile.badges.filter((b: ProfileBadge) => b.type === 'confetti').map((badge: ProfileBadge) => (
              <div
                key={badge.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-xs font-medium text-amber"
              >
                🎉 {badge.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] md:text-xs text-ink-muted mt-2 italic">
            Earned through consistent reading and community recognition.
          </p>
        </motion.section>
      )}

      {/* Currently Reading */}
      {showCurrentlyReading && (
      <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card mx-4 mt-4 rounded-2xl p-6 md:mx-auto md:max-w-2xl lg:max-w-4xl">
        <h2
          className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Clock className="w-5 h-5" style={{ color: accent.accent }} />
          Currently Reading
        </h2>
        {currentlyReading.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {currentlyReading.map((book) => (
              <div key={book.id} className="flex-shrink-0 w-28 glass-card rounded-xl p-2">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-40 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent.accentLight}, color-mix(in srgb, ${accent.accent} 20%, transparent))` }}>
                    <BookOpen className="w-8 h-8" style={{ color: `color-mix(in srgb, ${accent.accent} 50%, transparent)` }} />
                  </div>
                )}
                <p className="text-xs text-ink mt-2 line-clamp-2 font-medium">{book.title}</p>
                {book.currentPage > 0 && book.totalPages > 0 && (
                  <div className="mt-1">
                    <div className="h-1 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(book.currentPage / book.totalPages) * 100}%`, background: `linear-gradient(90deg, ${accent.accent}, ${accent.accentLight})` }}
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-ink-muted mt-0.5">
                      {Math.round((book.currentPage / book.totalPages) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-ink-muted text-sm">No books currently being read.</div>
        )}
      </motion.section>
      )}

      {/* Completed Books */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 mt-6 md:mx-auto md:max-w-2xl lg:max-w-4xl">
        <h2
          className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Trophy className="w-5 h-5 text-forest" />
          Completed ({completedBooks.length})
        </h2>
        {completedBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {completedBooks.slice(0, 12).map((book) => (
                <div key={book.id} className="group relative">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm" />
                  ) : (
                    <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gold/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 opacity-0 active:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                    <p className="text-white text-[10px] md:text-xs text-center line-clamp-3">{book.title}</p>
                  </div>
                </div>
              ))}
            </div>
            {completedBooks.length > 12 && (
              <p className="text-center text-xs text-ink-muted mt-3">
                +{completedBooks.length - 12} more books
              </p>
            )}
          </>
        ) : (
          <div className="text-ink-muted text-sm">No completed books yet.</div>
        )}
      </motion.section>

      {/* Want to Read */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mx-4 mt-6 md:mx-auto md:max-w-2xl lg:max-w-4xl">
        <h2
          className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <BookMarked className="w-5 h-5 text-gold" />
          Want to Read ({wantToRead.length})
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {wantToRead.slice(0, 6).map((book) => (
            <div key={book.id} className="group relative">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm opacity-80" />
              ) : (
                <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-gold/10 to-amber/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gold/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 opacity-0 active:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                <p className="text-white text-[10px] md:text-xs text-center line-clamp-3">{book.title}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>


    </div>
  );
}



