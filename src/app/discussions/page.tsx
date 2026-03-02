'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Edit3,
  Check,
  UserPlus,
  Search,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { Book } from '@/lib/types';

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

  // Edit state
  const [editingDiscussion, setEditingDiscussion] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<{ id: string; reader_name: string; avatar_url: string | null }[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [members, setMembers] = useState<{ id: string; reader_name: string; avatar_url: string | null }[]>([]);

  // User's books for linking
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [bookPickerSearch, setBookPickerSearch] = useState('');

  // Realtime subscription ref
  const realtimeChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Scroll to bottom ref
  const postsEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Cleanup realtime on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, []);
  // Create form
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBookTitle, setFormBookTitle] = useState('');
  const [formBookAuthor, setFormBookAuthor] = useState('');
  const [formColor, setFormColor] = useState('gold');
  const [formIsPublic, setFormIsPublic] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, [user]);

  const fetchDiscussions = async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const supabase = createClient();

    // Fetch public discussions + private discussions the user is a member of
    let allDiscussions: any[] = [];

    // Public discussions
    const { data: publicData } = await supabase
      .from('discussions')
      .select('*, creator:creator_id(reader_name, avatar_url)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);
    if (publicData) allDiscussions = [...publicData];

    // Private discussions the user is in (if logged in)
    if (user) {
      const { data: myMemberships } = await supabase
        .from('discussion_members')
        .select('discussion_id')
        .eq('user_id', user.id);
      if (myMemberships && myMemberships.length > 0) {
        const memberDiscIds = myMemberships.map((m: any) => m.discussion_id);
        const { data: privateData } = await supabase
          .from('discussions')
          .select('*, creator:creator_id(reader_name, avatar_url)')
          .eq('is_public', false)
          .in('id', memberDiscIds)
          .order('created_at', { ascending: false });
        if (privateData) {
          // Merge without duplicates
          const existingIds = new Set(allDiscussions.map((d: any) => d.id));
          privateData.forEach((d: any) => { if (!existingIds.has(d.id)) allDiscussions.push(d); });
        }
      }
    }

    if (allDiscussions.length > 0) {
      const enriched = await Promise.all(allDiscussions.map(async (d: any) => {
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
        is_public: formIsPublic,
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
      setFormIsPublic(true);
      setShowCreate(false);
      fetchDiscussions();
    } catch (err) {
      setCreateError('Unexpected error creating discussion.');
      console.error(err);
    }
    setCreating(false);
  };

  const openDiscussion = async (disc: Discussion) => {
    // Clean up previous realtime subscription
    if (realtimeChannelRef.current) {
      const sb = createClient();
      sb.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    setSelectedDiscussion(disc);
    setPostsLoading(true);
    const supabase = createClient();

    try {
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

        // Fetch user's books for linking
        const { data: profile } = await supabase
          .from('profiles')
          .select('reading_data')
          .eq('id', user.id)
          .single();
        if (profile?.reading_data?.books) {
          setUserBooks(profile.reading_data.books);
        }
      }

      // Fetch members list
      const { data: membersData } = await supabase
        .from('discussion_members')
        .select('user_id, profiles:user_id(reader_name, avatar_url)')
        .eq('discussion_id', disc.id)
        .limit(50);
      if (membersData) {
        setMembers(membersData.map((m: any) => ({
          id: m.user_id,
          reader_name: (m.profiles as any)?.reader_name || 'Unknown',
          avatar_url: (m.profiles as any)?.avatar_url || null,
        })));
      }

      // Subscribe to realtime new posts
      const channel = supabase
        .channel(`discussion-${disc.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'discussion_posts',
            filter: `discussion_id=eq.${disc.id}`,
          },
          async (payload) => {
            const newPostData = payload.new as any;
            // Don't duplicate if we already added this post locally (from our own send)
            setPosts(prev => {
              if (prev.some(p => p.id === newPostData.id)) return prev;
              return prev; // Will be enriched below
            });

            // Fetch the full post with user info
            const { data: fullPost } = await supabase
              .from('discussion_posts')
              .select('*, user:user_id(reader_name, avatar_url)')
              .eq('id', newPostData.id)
              .single();

            if (fullPost) {
              setPosts(prev => {
                if (prev.some(p => p.id === fullPost.id)) return prev;
                return [...prev, fullPost as unknown as DiscussionPost];
              });
              // Auto-scroll to new message
              setTimeout(scrollToBottom, 100);
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    } finally {
      setPostsLoading(false);
      setTimeout(scrollToBottom, 300);
    }
  };

  const handleEditDiscussion = async () => {
    if (!selectedDiscussion || !editTitle.trim()) return;
    setEditSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('discussions')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        book_title: editBookTitle.trim() || null,
        book_author: editBookAuthor.trim() || null,
      })
      .eq('id', selectedDiscussion.id);

    if (!error) {
      setSelectedDiscussion({
        ...selectedDiscussion,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        book_title: editBookTitle.trim() || null,
        book_author: editBookAuthor.trim() || null,
      });
      setEditingDiscussion(null);
      fetchDiscussions();
    }
    setEditSaving(false);
  };

  const handleSearchMembers = async (query: string) => {
    setMemberSearch(query);
    if (query.length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, reader_name, avatar_url')
      .or(`reader_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(8);
    if (data) {
      // Filter out existing members
      const memberIds = members.map(m => m.id);
      setMemberResults(data.filter((p: any) => !memberIds.includes(p.id)));
    }
    setMemberSearching(false);
  };

  const handleAddMember = async (userId: string, readerName: string, avatarUrl: string | null) => {
    if (!selectedDiscussion) return;
    const supabase = createClient();
    const { error } = await supabase.from('discussion_members').insert({
      discussion_id: selectedDiscussion.id,
      user_id: userId,
    });
    if (!error) {
      setMembers(prev => [...prev, { id: userId, reader_name: readerName, avatar_url: avatarUrl }]);
      setMemberResults(prev => prev.filter(p => p.id !== userId));
    }
  };

  const handleLinkBook = (book: Book) => {
    if (!selectedDiscussion) return;
    setEditBookTitle(book.title);
    setEditBookAuthor(book.author);
    setShowBookPicker(false);
    setBookPickerSearch('');
  };

  const handleJoin = async () => {
    if (!user || !selectedDiscussion) return;
    setJoining(true);
    const supabase = createClient();
    const { error } = await supabase.from('discussion_members').insert({
      discussion_id: selectedDiscussion.id,
      user_id: user.id,
    });
    if (!error) {
      setIsMember(true);
      // Notify the discussion creator
      if (selectedDiscussion.creator_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: selectedDiscussion.creator_id,
          type: 'discussion_join',
          from_user_id: user.id,
          data: { discussion_title: selectedDiscussion.title, discussion_id: selectedDiscussion.id },
        });
      }
    }
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
      setNewPost('');

      // Notify all other members in this discussion
      const { data: memberList } = await supabase
        .from('discussion_members')
        .select('user_id')
        .eq('discussion_id', selectedDiscussion.id)
        .neq('user_id', user.id);

      if (memberList && memberList.length > 0) {
        const notifications = memberList.map((m: any) => ({
          user_id: m.user_id,
          type: 'new_discussion_post',
          from_user_id: user.id,
          data: {
            discussion_id: selectedDiscussion.id,
            discussion_title: selectedDiscussion.title,
            post_preview: newPost.trim().slice(0, 100),
          },
        }));
        await supabase.from('notifications').insert(notifications);
      }
    } else if (error) {
      console.error('Post failed:', error);
    }
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
              onClick={() => {
                // Clean up realtime subscription when leaving
                if (realtimeChannelRef.current) {
                  const sb = createClient();
                  sb.removeChannel(realtimeChannelRef.current);
                  realtimeChannelRef.current = null;
                }
                setSelectedDiscussion(null); setPosts([]); setEditingDiscussion(null); setShowAddMember(false);
              }}
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Marginalia
            </button>

            {/* Editing mode */}
            {editingDiscussion === selectedDiscussion.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-lg font-bold"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  placeholder="Discussion title"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editBookTitle}
                        onChange={(e) => setEditBookTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                        placeholder="Linked book title"
                      />
                      <input
                        type="text"
                        value={editBookAuthor}
                        onChange={(e) => setEditBookAuthor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm"
                        placeholder="Author"
                      />
                    </div>
                    {/* Pick from your library */}
                    <button
                      onClick={() => setShowBookPicker(!showBookPicker)}
                      className="text-xs text-gold-dark hover:text-gold mt-1.5 flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" /> Pick from your library
                    </button>
                    <AnimatePresence>
                      {showBookPicker && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <input
                            type="text"
                            value={bookPickerSearch}
                            onChange={(e) => setBookPickerSearch(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-cream/80 border border-gold-light/20 text-xs text-ink mb-1"
                            placeholder="Search your books..."
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {userBooks
                              .filter(b => !bookPickerSearch || b.title.toLowerCase().includes(bookPickerSearch.toLowerCase()))
                              .slice(0, 8)
                              .map(b => (
                                <button
                                  key={b.id}
                                  onClick={() => handleLinkBook(b)}
                                  className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-gold-light/10 transition-colors text-xs"
                                >
                                  {b.coverUrl ? (
                                    <img src={b.coverUrl} alt="" className="w-5 h-7 rounded object-cover flex-shrink-0" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-ink-muted flex-shrink-0" />
                                  )}
                                  <span className="text-ink truncate">{b.title}</span>
                                  <span className="text-ink-muted ml-auto">{b.author}</span>
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEditDiscussion}
                    disabled={editSaving || !editTitle.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-parchment flex items-center gap-1"
                    style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                  >
                    {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </motion.button>
                  <button
                    onClick={() => setEditingDiscussion(null)}
                    className="px-4 py-2 rounded-xl text-xs text-ink-muted border border-gold-light/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: theme.color }} />
                  <h1 className="text-2xl font-bold text-ink flex-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {selectedDiscussion.title}
                  </h1>
                  {user?.id === selectedDiscussion.creator_id && (
                    <button
                      onClick={() => {
                        setEditingDiscussion(selectedDiscussion.id);
                        setEditTitle(selectedDiscussion.title);
                        setEditDescription(selectedDiscussion.description || '');
                        setEditBookTitle(selectedDiscussion.book_title || '');
                        setEditBookAuthor(selectedDiscussion.book_author || '');
                      }}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gold-light/10 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
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
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="flex items-center gap-0.5 hover:text-gold-dark transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> {members.length} members
                    {user?.id === selectedDiscussion.creator_id && <UserPlus className="w-3 h-3 ml-0.5" />}
                  </button>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-3.5 h-3.5" /> {posts.length} posts</span>
                </div>

                {/* Members & Add Member Panel */}
                <AnimatePresence>
                  {showAddMember && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="glass-card rounded-xl p-3 space-y-2">
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Members</p>
                        <div className="flex flex-wrap gap-2">
                          {members.map(m => (
                            <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gold-light/10 text-xs text-ink">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center text-[8px] font-bold text-gold-dark">
                                  {m.reader_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {m.reader_name}
                            </div>
                          ))}
                        </div>
                        {user?.id === selectedDiscussion.creator_id && (
                          <div className="pt-2 border-t border-gold-light/20">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
                              <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => handleSearchMembers(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cream/50 border border-gold-light/20 text-xs text-ink"
                                placeholder="Search users to invite..."
                              />
                            </div>
                            {memberSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold mx-auto mt-2" />}
                            {memberResults.length > 0 && (
                              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {memberResults.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddMember(p.id, p.reader_name, p.avatar_url)}
                                    className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-gold-light/10 transition-colors text-xs"
                                  >
                                    <UserPlus className="w-3 h-3 text-gold-dark" />
                                    <span className="text-ink">{p.reader_name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
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
              <div ref={postsEndRef} />
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPost(); } }}
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
              Marginalia
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">Notes in the margins — discuss books with fellow readers</p>
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
                {/* Public/Private toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-ink">
                      {formIsPublic ? 'Public Discussion' : 'Private Discussion'}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      {formIsPublic ? 'Anyone can find and join' : 'Only invited members can see and join'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormIsPublic(!formIsPublic)}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
                      formIsPublic ? 'bg-gold' : 'bg-rose/40'
                    }`}
                  >
                    <div
                      className="absolute top-0.5 w-6 h-6 rounded-full bg-parchment shadow-sm transition-all duration-300"
                      style={{ left: formIsPublic ? '1.375rem' : '0.125rem' }}
                    />
                  </button>
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
              No threads yet
            </h2>
            <p className="text-ink-muted mb-6">Be the first to start a marginalia thread!</p>
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
                        <h3 className="text-sm font-semibold text-ink group-hover:text-gold-dark transition-colors truncate flex items-center gap-1.5">
                      {!disc.is_public && <Lock className="w-3 h-3 text-rose/60 flex-shrink-0" />}
                      {disc.title}
                    </h3>
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