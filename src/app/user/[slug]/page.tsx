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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isSupabaseConfigured()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();
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
      setLoading(false);

      // Check follow status and counts
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
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
        }
      } else {
        // Follow
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
          This profile does not exist, is not public, or the link is incorrect.
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

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card mx-4 mt-4 rounded-2xl p-6 md:mx-auto md:max-w-2xl">
        <div className="flex items-start gap-4">
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
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-bold text-ink truncate"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {profile.reader_name}
            </h1>
            <p className="text-xs text-ink-muted mb-2">@{profile.public_slug}</p>
            {profile.bio && (
              <p className="text-sm text-ink-muted italic mb-3 line-clamp-2">{profile.bio}</p>
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
                      : 'text-parchment shadow-sm'
                  }`}
                  style={!isFollowing ? { background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' } : undefined}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    'Following'
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
        <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-gold-light/20">
          <div className="text-center">
            <Library className="w-4 h-4 mx-auto text-gold mb-1" />
            <div className="text-lg font-bold text-ink">{books.length}</div>
            <div className="text-[10px] text-ink-muted">Books</div>
          </div>
          <div className="text-center">
            <Trophy className="w-4 h-4 mx-auto text-forest mb-1" />
            <div className="text-lg font-bold text-ink">{completedBooks.length}</div>
            <div className="text-[10px] text-ink-muted">Read</div>
          </div>
          <div className="text-center">
            <BookOpen className="w-4 h-4 mx-auto text-amber mb-1" />
            <div className="text-lg font-bold text-ink">{totalPages.toLocaleString()}</div>
            <div className="text-[10px] text-ink-muted">Pages</div>
          </div>
          <div className="text-center">
            <Star className="w-4 h-4 mx-auto text-gold mb-1" />
            <div className="text-lg font-bold text-ink">{avgRating.toFixed(1)}</div>
            <div className="text-[10px] text-ink-muted">Avg</div>
          </div>
        </div>
      </motion.section>

      {/* Recommend Modal */}
      {showRecommendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRecommendModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-parchment rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gold-light/30"
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

      {/* Currently Reading */}
      <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card mx-4 mt-4 rounded-2xl p-6 md:mx-auto md:max-w-2xl">
        <h2
          className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Clock className="w-5 h-5 text-amber" />
          Currently Reading
        </h2>
        {currentlyReading.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {currentlyReading.map((book) => (
              <div key={book.id} className="flex-shrink-0 w-28 glass-card rounded-xl p-2">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-40 rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gold/50" />
                  </div>
                )}
                <p className="text-xs text-ink mt-2 line-clamp-2 font-medium">{book.title}</p>
                {book.currentPage > 0 && book.totalPages > 0 && (
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
        ) : (
          <div className="text-ink-muted text-sm">No books currently being read.</div>
        )}
      </motion.section>

      {/* Completed Books */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 mt-6 md:mx-auto md:max-w-2xl">
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
          </>
        ) : (
          <div className="text-ink-muted text-sm">No completed books yet.</div>
        )}
      </motion.section>

      {/* Want to Read */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mx-4 mt-6 md:mx-auto md:max-w-2xl">
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                <p className="text-white text-[10px] text-center line-clamp-3">{book.title}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}



