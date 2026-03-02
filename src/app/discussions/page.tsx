'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  BookOpen,
  Users,
  Clock,
  Send,
  Loader2,
  ArrowLeft,
  X,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Discussion {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  book_title: string | null;
  book_author: string | null;
  book_cover_url: string | null;
  accent_color: string;
  is_public: boolean;
  created_at: string;
  creator?: { reader_name: string; avatar_url: string | null };
  member_count?: number;
  post_count?: number;
}

interface DiscussionPost {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { reader_name: string; avatar_url: string | null };
}

// Use CSS variable colors that match the app's theme
const accentColors: { name: string; color: string; light: string; label: string }[] = [
  { name: 'gold', color: 'var(--th-gold)', light: 'var(--th-gold-light)', label: 'Gold' },
  { name: 'teal', color: 'var(--th-teal)', light: 'var(--th-teal-light)', label: 'Teal' },
  { name: 'rose', color: 'var(--th-rose)', light: 'var(--th-rose-light)', label: 'Rose' },
  { name: 'forest', color: 'var(--th-forest)', light: 'var(--th-forest-light)', label: 'Forest' },
  { name: 'plum', color: 'var(--th-plum)', light: 'var(--th-lavender)', label: 'Plum' },
  { name: 'copper', color: 'var(--th-copper)', light: 'var(--th-amber)', label: 'Copper' },
];

const getTheme = (name: string) => accentColors.find(c => c.name === name) || accentColors[0];

export default function DiscussionsPage() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  // Create form
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBookTitle, setFormBookTitle] = useState('');
  const [formBookAuthor, setFormBookAuthor] = useState('');
  const [formColor, setFormColor] = useState('gold');

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('discussions')
      .select('*, creator:creator_id(reader_name, avatar_url)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Fetch discussions error:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const enriched = await Promise.all(data.map(async (d: any) => {
        const { count: members } = await supabase.from('discussion_members').select('*', { count: 'exact', head: true }).eq('discussion_id', d.id);
        const { count: postCount } = await supabase.from('discussion_posts').select('*', { count: 'exact', head: true }).eq('discussion_id', d.id);
        return { ...d, member_count: members || 0, post_count: postCount || 0 };
      }));
      setDiscussions(enriched);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !formTitle.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const supabase = createClient();

      const { data: disc, error } = await supabase.from('discussions').insert({
        creator_id: user.id,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        book_title: formBookTitle.trim() || null,
        book_author: formBookAuthor.trim() || null,
        accent_color: formColor,
        is_public: true,
      }).select().single();

      if (error) {
        console.error('Create discussion error:', error);
        setCreateError(error.message || 'Failed to create discussion. Make sure the discussions table exists.');
        setCreating(false);
        return;
      }

      if (!disc) {
        setCreateError('No data returned. The discussions table may not exist yet.');
        setCreating(false);
        return;
      }

      // Auto-join as member
      await supabase.from('discussion_members').insert({
        discussion_id: disc.id,
        user_id: user.id,
      });

      setFormTitle('');
      setFormDescription('');
      setFormBookTitle('');
      setFormBookAuthor('');
      setFormColor('gold');
      setShowCreate(false);
      fetchDiscussions();
    } catch (err) {
      setCreateError('Unexpected error creating discussion.');
      console.error(err);
    }
    setCreating(false);
  };

  const openDiscussion = async (disc: Discussion) => {
    setSelectedDiscussion(disc);
    setPostsLoading(true);
    const supabase = createClient();

    const { data: postsData } = await supabase
      .from('discussion_posts')
      .select('*, user:user_id(reader_name, avatar_url)')
      .eq('discussion_id', disc.id)
      .order('created_at', { ascending: true })
      .limit(100);
    setPosts((postsData as unknown as DiscussionPost[]) || []);

    if (user) {
      const { data: mem } = await supabase
        .from('discussion_members')
        .select('user_id')
        .eq('discussion_id', disc.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setIsMember(!!mem);
    }
    setPostsLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !selectedDiscussion) return;
    setJoining(true);
    const supabase = createClient();
    const { error } = await supabase.from('discussion_members').insert({
      discussion_id: selectedDiscussion.id,
      user_id: user.id,
    });
    if (!error) setIsMember(true);
    setJoining(false);
  };

  const handleSendPost = async () => {
    if (!user || !selectedDiscussion || !newPost.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data: post, error } = await supabase.from('discussion_posts').insert({
      discussion_id: selectedDiscussion.id,
      user_id: user.id,
      content: newPost.trim(),
    }).select('*, user:user_id(reader_name, avatar_url)').single();

    if (post && !error) {
      setPosts(prev => [...prev, post as unknown as DiscussionPost]);
    }
    setNewPost('');
    setSending(false);
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

  // ── Discussion thread view ──
  if (selectedDiscussion) {
    const theme = getTheme(selectedDiscussion.accent_color);
    return (
      <div className="min-h-screen pb-24 md:pb-8 flex flex-col">
        <div className="px-4 pt-4 pb-4 border-b border-gold-light/20 bg-cream/50">
          <div className="md:max-w-2xl md:mx-auto">
            <button
              onClick={() => { setSelectedDiscussion(null); setPosts([]); }}
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Discussions
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: theme.color }} />
              <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {selectedDiscussion.title}
              </h1>
            </div>
            {selectedDiscussion.description && (
              <p className="text-sm text-ink-muted italic ml-6">{selectedDiscussion.description}</p>
            )}
            {selectedDiscussion.book_title && (
              <div className="flex items-center gap-2 mt-2 ml-6">
                <BookOpen className="w-4 h-4 text-ink-muted" />
                <span className="text-sm text-ink-muted">
                  {selectedDiscussion.book_title}
                  {selectedDiscussion.book_author && ` by ${selectedDiscussion.book_author}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {selectedDiscussion.member_count} members</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {posts.length} posts</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:max-w-2xl md:mx-auto md:w-full">
          {postsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gold/30 mx-auto mb-3" />
              <p className="text-ink-muted text-sm">No posts yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3"
                >
                  {(post.user as any)?.avatar_url ? (
                    <img src={(post.user as any).avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-parchment text-xs font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.light})` }}
                    >
                      {((post.user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-ink">{(post.user as any)?.reader_name || 'Unknown'}</span>
                      <span className="text-[10px] text-ink-muted">{formatTime(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-ink mt-0.5 whitespace-pre-wrap break-words">{post.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {user && isMember ? (
          <div className="border-t border-gold-light/20 px-4 py-3 bg-parchment/80 backdrop-blur-sm">
            <div className="md:max-w-2xl md:mx-auto flex gap-2">
              <input
                type="text"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendPost()}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendPost}
                disabled={!newPost.trim() || sending}
                className="px-4 py-2.5 rounded-xl text-parchment disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        ) : user && !isMember ? (
          <div className="border-t border-gold-light/20 px-4 py-4 bg-parchment/80 backdrop-blur-sm text-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              disabled={joining}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-parchment"
              style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Join Discussion to Post'}
            </motion.button>
          </div>
        ) : (
          <div className="border-t border-gold-light/20 px-4 py-4 bg-parchment/80 text-center">
            <Link href="/login" className="text-sm text-gold-dark hover:text-gold transition-colors">Sign in to join the discussion</Link>
          </div>
        )}
      </div>
    );
  }

  // ── Discussions list view ──
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-parchment/80 backdrop-blur-md px-4 py-4 border-b border-gold-light/20"
      >
        <div className="md:max-w-2xl md:mx-auto flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-ink flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <MessageSquare className="w-6 h-6 text-gold" />
              Book Club
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">Discuss books with fellow readers</p>
          </div>
          {user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCreate(!showCreate); setCreateError(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-parchment"
              style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
            >
              <Plus className="w-4 h-4" /> New
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="px-4 py-6 md:max-w-2xl md:mx-auto">
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card rounded-2xl p-5 space-y-3 border border-gold-light/30">
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Start a Discussion</h3>

                {createError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Discussion title *"
                  className="w-full px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                />
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formBookTitle}
                    onChange={(e) => setFormBookTitle(e.target.value)}
                    placeholder="Book title (optional)"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                  />
                  <input
                    type="text"
                    value={formBookAuthor}
                    onChange={(e) => setFormBookAuthor(e.target.value)}
                    placeholder="Author"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm placeholder:text-ink-muted/60"
                  />
                </div>
                <div>
                  <p className="text-xs text-ink-muted mb-1.5">Thread Color</p>
                  <div className="flex gap-2">
                    {accentColors.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setFormColor(c.name)}
                        title={c.label}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${c.color}, ${c.light})`,
                          borderColor: formColor === c.name ? 'var(--th-ink)' : 'transparent',
                          transform: formColor === c.name ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreate}
                    disabled={!formTitle.trim() || creating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-parchment disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Discussion'}
                  </motion.button>
                  <button
                    onClick={() => { setShowCreate(false); setCreateError(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              No discussions yet
            </h2>
            <p className="text-ink-muted mb-6">Be the first to start a book club discussion!</p>
            {user && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 rounded-xl text-sm font-medium text-parchment"
                style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
              >
                Start a Discussion
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {discussions.map((disc, index) => {
              const theme = getTheme(disc.accent_color);
              return (
                <motion.div
                  key={disc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => openDiscussion(disc)}
                    className="w-full text-left glass-card rounded-xl p-4 hover:bg-cream/40 transition-colors group"
                    style={{ borderLeft: `4px solid ${theme.color}` }}
                  >
                    <div className="flex items-start gap-3">
                      {(disc.creator as any)?.avatar_url ? (
                        <img src={(disc.creator as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-parchment text-sm font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.light})` }}
                        >
                          {((disc.creator as any)?.reader_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-ink group-hover:text-gold-dark transition-colors truncate">{disc.title}</h3>
                        {disc.description && <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{disc.description}</p>}
                        {disc.book_title && (
                          <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {disc.book_title}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-muted">
                          <span>{(disc.creator as any)?.reader_name}</span>
                          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {disc.member_count}</span>
                          <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {disc.post_count}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatTime(disc.created_at)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-muted/30 group-hover:text-gold-dark transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}