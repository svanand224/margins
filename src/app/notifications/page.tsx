'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  UserPlus,
  MessageSquare,
  Gift,
  Check,
  Loader2,
  ArrowLeft,
  Trash2,
  CheckCheck,
  Award,
  Lock,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  from_user_id: string | null;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  from_user?: { reader_name: string; avatar_url: string | null; username: string | null; public_slug: string | null };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!isSupabaseConfigured() || !user) { setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*, from_user:from_user_id(reader_name, avatar_url, username, public_slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as unknown as Notification[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user || !isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_follower': return <UserPlus className="w-4 h-4 text-gold" />;
      case 'new_recommendation': return <Gift className="w-4 h-4 text-rose" />;
      case 'discussion_join': return <MessageSquare className="w-4 h-4 text-gold-dark" />;
      case 'new_discussion_post': return <MessageSquare className="w-4 h-4 text-teal" />;
      case 'new_comment': return <MessageSquare className="w-4 h-4 text-copper" />;
      case 'badge_unlocked': return <Award className="w-4 h-4 text-amber" />;
      case 'follow_request': return <Lock className="w-4 h-4 text-gold" />;
      case 'follow_request_accepted': return <UserCheck className="w-4 h-4 text-forest" />;
      default: return <Bell className="w-4 h-4 text-gold" />;
    }
  };

  const getMessage = (n: Notification) => {
    const name = (n.from_user as any)?.reader_name || 'Someone';
    switch (n.type) {
      case 'new_follower': return <><strong>{name}</strong> started following you</>;
      case 'new_recommendation': return <><strong>{name}</strong> recommended <em>&ldquo;{n.data.book_title || 'a book'}&rdquo;</em> to you</>;
      case 'discussion_join': return <><strong>{name}</strong> joined your discussion <em>&ldquo;{n.data.discussion_title || ''}&rdquo;</em></>;
      case 'new_discussion_post': return <><strong>{name}</strong> posted in <em>&ldquo;{n.data.discussion_title || 'a discussion'}&rdquo;</em></>;
      case 'new_comment': return <><strong>{name}</strong> commented on your shelf</>;
      case 'badge_unlocked': return <>You earned the <strong>{n.data.badge_label || 'achievement'}</strong> badge!</>;
      case 'follow_request': return <><strong>{name}</strong> wants to follow you</>;
      case 'follow_request_accepted': return <><strong>{name}</strong> accepted your follow request</>;
      default: return <>{n.data.message || 'You have a notification'}</>;
    }
  };

  const getLink = (n: Notification) => {
    switch (n.type) {
      case 'new_follower': return (n.from_user as any)?.public_slug ? `/user/${(n.from_user as any).public_slug}` : null;
      case 'new_recommendation': return '/recommendations';
      case 'discussion_join': return '/discussions';
      case 'new_discussion_post': return '/discussions';
      case 'badge_unlocked': return '/goals';
      case 'follow_request': return '/profile';
      case 'follow_request_accepted': return (n.from_user as any)?.public_slug ? `/user/${(n.from_user as any).public_slug}` : null;
      default: return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-gold/30 mx-auto mb-3" />
          <p className="text-ink-muted">Sign in to see notifications</p>
          <Link href="/login" className="text-sm text-gold-dark hover:text-gold mt-2 inline-block">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-parchment/80 backdrop-blur-md px-4 py-4 border-b border-gold-light/20"
      >
        <div className="md:max-w-2xl lg:max-w-4xl md:mx-auto flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-ink flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <Bell className="w-6 h-6 text-gold" />
              Notifications
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gold-dark hover:bg-gold-light/10 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="px-4 py-6 md:max-w-2xl lg:max-w-4xl md:mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gold/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              No notifications yet
            </h2>
            <p className="text-ink-muted text-sm">
              You&apos;ll get notified when someone follows you, recommends a book, or joins your discussions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const link = getLink(n);
              const Wrapper = link ? Link : 'div';
              const wrapperProps = link ? { href: link } : {};
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Wrapper
                    {...(wrapperProps as any)}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`glass-card rounded-xl p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !n.read ? 'border-l-4 border-gold bg-gold-light/5' : 'hover:bg-cream/40'
                    }`}
                  >
                    {(n.from_user as any)?.avatar_url ? (
                      <img src={(n.from_user as any).avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center text-parchment font-bold flex-shrink-0">
                        {((n.from_user as any)?.reader_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {getIcon(n.type)}
                        <span className="text-[10px] md:text-xs text-ink-muted">{formatTime(n.created_at)}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-ink">{getMessage(n)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(n.id); }}
                      className="p-1.5 rounded-lg text-ink-muted/30 hover:text-rose hover:bg-rose/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
