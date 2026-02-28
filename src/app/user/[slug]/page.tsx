'use client';

import { useState, useEffect, use } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  BookMarked,
  Library,
  Star,
  Clock,
  Trophy,
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  Trash2,
  Calendar,
  UserPlus,
  UserCheck,
  Users,
  Gift,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

interface PublicProfile {
  id: string;
  reader_name: string;
  avatar_url: string | null;
  bio: string;
  favorite_genre: string;
  public_slug: string;
  shelf_public: boolean;
  reading_data: {
    books?: Book[];
    goals?: { pagesPerDay?: number; booksPerYear?: number };
    dailyLogs?: Record<string, { pagesRead: number; minutesRead: number }>;
  };
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    reader_name: string;
    avatar_url: string | null;
    public_slug: string | null;
  };
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Social state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // Recommendation modal
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendBook, setRecommendBook] = useState({ title: '', author: '', message: '' });
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendSuccess, setRecommendSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isSupabaseConfigured()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch profile by slug
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, shelf_public, reading_data, created_at')
        .eq('public_slug', slug)
        .eq('shelf_public', true)
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as PublicProfile);

      // Fetch DMs (messages between current user and profile owner)
      if (user) {
        const { data: dmsData } = await supabase
          .from('dms')
          .select(`
            id,
            content,
            created_at,
            sender:sender_id (
              id,
              reader_name,
              avatar_url,
              public_slug
            ),
            recipient:recipient_id (
              id,
              reader_name,
              avatar_url,
              public_slug
            )
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${profileData.id}),and(sender_id.eq.${profileData.id},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
          .limit(100);
        if (dmsData) {
          setMessages(dmsData);
        }
      }

      // Fetch follow counts and lists
      const { count: followers, data: followersData } = await supabase
        .from('follows')
        .select('id, follower:profiles!follows_follower_id (id, reader_name, avatar_url, public_slug)', { count: 'exact', head: false })
        .eq('following_id', profileData.id);

      const { count: following, data: followingData } = await supabase
        .from('follows')
        .select('id, following:profiles!follows_following_id (id, reader_name, avatar_url, public_slug)', { count: 'exact', head: false })
        .eq('follower_id', profileData.id);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
      setFollowersList((followersData || []).map(f => f.follower));
      setFollowingList((followingData || []).map(f => f.following));

      // Check if current user follows this profile
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .single();

        setIsFollowing(!!followData);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [slug, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;

    setFollowLoading(true);
    const supabase = createClient();

    if (isFollowing) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
    } else {
      // Follow
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profile.id,
      });

      if (!error) {
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);

        // Create notification
        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'new_follower',
          from_user_id: user.id,
          data: {
            follower_name: currentUserProfile?.reader_name,
            follower_slug: currentUserProfile?.public_slug,
            follower_avatar: currentUserProfile?.avatar_url,
          },
        });

        // Create activity
        await supabase.from('activities').insert({
          user_id: user.id,
          type: 'followed',
          data: {
            following_id: profile.id,
            following_name: profile.reader_name,
            following_slug: profile.public_slug,
            following_avatar: profile.avatar_url,
          },
        });
      }
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
      // Create notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'new_recommendation',
        from_user_id: user.id,
        data: {
          from_name: currentUserProfile?.reader_name,
          from_slug: currentUserProfile?.public_slug,
          from_avatar: currentUserProfile?.avatar_url,
          book_title: recommendBook.title,
        },
      });

      setRecommendSuccess(true);
      setTimeout(() => {
        setShowRecommendModal(false);
        setRecommendBook({ title: '', author: '', message: '' });
        setRecommendSuccess(false);
      }, 1500);
    }

    setRecommendLoading(false);
  };

  const handleSendMessage = async () => {
    if (!user || !profile || !newMessage.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      setSending(true);
      const supabase = createClient();
      // ...existing code for sending a DM message...
  const currentlyReading = books.filter((b) => b.status === 'reading');
  const wantToRead = books.filter((b) => b.status === 'want-to-read');
  const totalPages = completedBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0);
  const avgRating =
    completedBooks.filter((b) => b.rating).length > 0
      ? completedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) /
        completedBooks.filter((b) => b.rating).length
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
        <p className="text-ink-muted mb-6">This profile doesn&apos;t exist or isn&apos;t public.</p>
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

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mx-4 mt-4 rounded-2xl p-6 md:mx-auto md:max-w-2xl"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.reader_name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                color: 'var(--th-parchment)',
              }}
            >
              {(profile.reader_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {profile.reader_name}
            </h1>
            <p className="text-sm text-ink-muted">@{profile.public_slug}</p>
            {profile.bio && (
              <p className="text-ink-muted text-sm mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {profile.bio}
              </p>
            )}

            {/* Follow Stats - clickable */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <button onClick={() => setShowFollowers(true)} className="text-ink hover:text-gold transition-colors">
                <strong>{followerCount}</strong>{' '}
                <span className="text-ink-muted">followers</span>
              </button>
              <button onClick={() => setShowFollowing(true)} className="text-ink hover:text-gold transition-colors">
                <strong>{followingCount}</strong>{' '}
                <span className="text-ink-muted">following</span>
              </button>
            </div>

            {/* Followers Modal - fully implemented */}
            <AnimatePresence>
              {showFollowers && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowFollowers(false)}>
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-burgundy mb-4 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}><Users className="w-6 h-6 text-gold" /> Followers</h3>
                    {followersList.length === 0 ? (
                      <div className="text-center text-ink-muted">No followers yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {followersList.map(f => (
                          <Link key={f.id} href={`/user/${f.public_slug}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream/40 transition-colors">
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt={f.reader_name} className="w-10 h-10 rounded-full object-cover border-2 border-gold" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gold to-amber text-parchment border-2 border-gold">
                                {f.reader_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-burgundy">{f.reader_name}</span>
                            <span className="text-xs text-ink-muted">@{f.public_slug}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Following Modal - fully implemented */}
            <AnimatePresence>
              {showFollowing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowFollowing(false)}>
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-burgundy mb-4 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}><Users className="w-6 h-6 text-gold" /> Following</h3>
                    {followingList.length === 0 ? (
                      <div className="text-center text-ink-muted">Not following anyone yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {followingList.map(f => (
                          <Link key={f.id} href={`/user/${f.public_slug}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream/40 transition-colors">
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt={f.reader_name} className="w-10 h-10 rounded-full object-cover border-2 border-gold" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gold to-amber text-parchment border-2 border-gold">
                                {f.reader_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-burgundy">{f.reader_name}</span>
                            <span className="text-xs text-ink-muted">@{f.public_slug}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        {user && !isOwnProfile && (
          <div className="flex gap-2 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                isFollowing
                  ? 'bg-cream/50 border border-gold-light/30 text-ink hover:bg-cream'
                  : 'text-parchment'
              }`}
              style={
                !isFollowing
                  ? { background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }
                  : undefined
              }
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRecommendModal(true)}
              className="py-2.5 px-4 rounded-xl text-sm font-medium bg-forest/10 text-forest hover:bg-forest/20 flex items-center gap-2 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Recommend
            </motion.button>
          </div>
        )}

        {/* Genre & Join Date */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gold-light/20 text-xs text-ink-muted">
          {profile.favorite_genre && (
            <span className="flex items-center gap-1">
              <BookMarked className="w-3 h-3" />
              {profile.favorite_genre}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-3 rounded-xl bg-cream/50">
            <Library className="w-4 h-4 mx-auto text-gold mb-1" />
            <div className="text-lg font-bold text-ink">{books.length}</div>
            <div className="text-xs text-ink-muted">Books</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-cream/50">
            <Trophy className="w-4 h-4 mx-auto text-forest mb-1" />
            <div className="text-lg font-bold text-ink">{completedBooks.length}</div>
            <div className="text-xs text-ink-muted">Read</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-cream/50">
            <BookOpen className="w-4 h-4 mx-auto text-amber mb-1" />
            <div className="text-lg font-bold text-ink">{totalPages.toLocaleString()}</div>
            <div className="text-xs text-ink-muted">Pages</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-cream/50">
            <Star className="w-4 h-4 mx-auto text-gold mb-1" />
            <div className="text-lg font-bold text-ink">{avgRating.toFixed(1)}</div>
            <div className="text-xs text-ink-muted">Avg</div>
          </div>
        </div>
      </motion.div>

      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-6 md:mx-auto md:max-w-2xl"
        >
          <h2
            className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Clock className="w-5 h-5 text-amber" />
            Currently Reading
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {currentlyReading.map((book) => (
              <div
                key={book.id}
                className="flex-shrink-0 w-28 glass-card rounded-xl p-2"
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gold/50" />
                  </div>
                )}
                <p className="text-xs text-ink mt-2 line-clamp-2 font-medium">{book.title}</p>
                {book.currentPage && book.totalPages && (
                  <div className="mt-1">
                    <div className="h-1 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-amber rounded-full"
                        style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      {Math.round((book.currentPage / book.totalPages) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Completed Books */}
      {completedBooks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mt-6 md:mx-auto md:max-w-2xl"
        >
          <h2
            className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Trophy className="w-5 h-5 text-forest" />
            Completed ({completedBooks.length})
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {completedBooks.slice(0, 12).map((book) => (
              <div key={book.id} className="group relative">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gold/50" />
                  </div>
                )}
                {book.rating && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                    {book.rating}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                  <p className="text-white text-[10px] text-center line-clamp-3">{book.title}</p>
                </div>
              </div>
            ))}
          </div>
          {completedBooks.length > 12 && (
            <p className="text-center text-xs text-ink-muted mt-3">
              +{completedBooks.length - 12} more books
            </p>
          )}
        </motion.section>
      )}

      {/* Want to Read */}
      {wantToRead.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-4 mt-6 md:mx-auto md:max-w-2xl"
        >
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
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm opacity-80"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-gold/10 to-amber/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gold/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                  <p className="text-white text-[10px] text-center line-clamp-3">{book.title}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ...existing code... */}

      {/* Recommend Book Modal */}
      <AnimatePresence>
        {showRecommendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRecommendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            >
              {recommendSuccess ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-forest/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Gift className="w-8 h-8 text-forest" />
                  </motion.div>
                  <h3
                    className="text-xl font-bold text-ink"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Recommendation Sent!
                  </h3>
                  <p className="text-ink-muted text-sm mt-2">
                    {profile.reader_name} will be notified
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3
                      className="text-xl font-bold text-ink"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Recommend a Book
                    </h3>
                    <button
                      onClick={() => setShowRecommendModal(false)}
                      className="text-ink-muted hover:text-ink transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-muted mb-4">
                    Suggest a book for <strong>{profile.reader_name}</strong> to read
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        Book Title *
                      </label>
                      <input
                        type="text"
                        value={recommendBook.title}
                        onChange={(e) => setRecommendBook({ ...recommendBook, title: e.target.value })}
                        placeholder="e.g., The Great Gatsby"
                        className="w-full px-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        Author
                      </label>
                      <input
                        type="text"
                        value={recommendBook.author}
                        onChange={(e) => setRecommendBook({ ...recommendBook, author: e.target.value })}
                        placeholder="e.g., F. Scott Fitzgerald"
                        className="w-full px-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        Why they&apos;d love it
                      </label>
                      <textarea
                        value={recommendBook.message}
                        onChange={(e) => setRecommendBook({ ...recommendBook, message: e.target.value })}
                        placeholder="I think you'd enjoy this because..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold resize-none"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRecommendBook}
                      disabled={!recommendBook.title.trim() || recommendLoading}
                      className="w-full py-3 rounded-xl text-sm font-medium text-parchment flex items-center justify-center gap-2 disabled:opacity-50 bg-forest"
                    >
                      {recommendLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          Send Recommendation
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
