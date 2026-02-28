'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  UserPlus,
  Gift,
  MessageCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  from_user_id: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isSupabaseConfigured() || !user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data as Notification[]);

        // Mark all as read
        const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds);
        }
      }

      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleClearAll = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_follower':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'new_recommendation':
        return <Gift className="w-5 h-5 text-forest" />;
      case 'new_comment':
        return <MessageCircle className="w-5 h-5 text-gold" />;
      default:
        return <Bell className="w-5 h-5 text-gold" />;
    }
  };

  const getNotificationContent = (notification: Notification) => {
    const data = notification.data as Record<string, string>;
    switch (notification.type) {
      case 'new_follower':
        return {
          text: <><strong>{data.follower_name}</strong> started following you</>,
          link: data.follower_slug ? `/user/${data.follower_slug}` : null,
          avatar: data.follower_avatar,
          name: data.follower_name,
        };
      case 'new_recommendation':
        return {
          text: <><strong>{data.from_name}</strong> recommended <strong>{data.book_title}</strong></>,
          link: '/recommendations',
          avatar: data.from_avatar,
          name: data.from_name,
        };
      case 'new_comment':
        return {
          text: <><strong>{data.from_name}</strong> commented on your profile</>,
          link: data.from_slug ? `/user/${data.from_slug}` : '/profile',
          avatar: null,
          name: data.from_name,
        };
      default:
        return {
          text: <>New notification</>,
          link: null,
          avatar: null,
          name: 'User',
        };
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
        <Bell className="w-16 h-16 text-gold/50 mb-4" />
        <h1
          className="text-2xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Sign In to See Notifications
        </h1>
        <p className="text-ink-muted mb-6">Stay updated on your reading community</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-ink flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <Bell className="w-6 h-6 text-gold" />
              Notifications
            </h1>
            <p className="text-sm text-ink-muted mt-1">Stay updated on activity</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </motion.div>

      {/* Notifications */}
      <div className="px-4 py-6 md:max-w-2xl md:mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <h2
              className="text-xl font-bold text-ink mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              No notifications yet
            </h2>
            <p className="text-ink-muted">
              When readers follow you or send recommendations, you&apos;ll see them here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const content = getNotificationContent(notification);

                const cardContent = (
                  <>
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-cream/50 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-ink"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                      >
                        {content.text}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-ink-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                );

                const cardClasses = `glass-card rounded-xl p-4 flex items-start gap-3 transition-colors ${
                  !notification.read ? 'border-l-4 border-gold' : ''
                }`;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {content.link ? (
                      <Link
                        href={content.link}
                        className={`${cardClasses} cursor-pointer hover:bg-cream/40`}
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      <div className={cardClasses}>
                        {cardContent}
                      </div>
                    )}
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
