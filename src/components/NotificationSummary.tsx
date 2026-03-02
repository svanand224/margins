'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserPlus, Gift, MessageSquare, X, Award } from 'lucide-react';
import Link from 'next/link';

export default function NotificationSummary() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<{
    followers: number;
    recommendations: number;
    discussions: number;
    badges: number;
    other: number;
    total: number;
  } | null>(null);
  const [show, setShow] = useState(false);
  const checkedRef = useRef(false);

  // Reset when user signs out so next sign-in shows summary
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem('notif_summary_shown');
      checkedRef.current = false;
      setShow(false);
      setSummary(null);
    }
  }, [user]);

  // Show summary on sign-in (once per session)
  useEffect(() => {
    if (loading || !user || checkedRef.current) return;
    checkedRef.current = true;

    const shown = sessionStorage.getItem('notif_summary_shown');
    if (shown) return;

    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchSummary = async () => {
    if (!isSupabaseConfigured() || !user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', user.id)
      .eq('read', false);

    if (!data || data.length === 0) return;

    const followers = data.filter(n => n.type === 'new_follower').length;
    const recommendations = data.filter(n => n.type === 'new_recommendation').length;
    const discussions = data.filter(n => n.type === 'discussion_join').length;
    const badges = data.filter(n => n.type === 'badge_unlocked').length;
    const other = data.length - followers - recommendations - discussions - badges;

    setSummary({ followers, recommendations, discussions, badges, other, total: data.length });
    setShow(true);
    sessionStorage.setItem('notif_summary_shown', '1');

    // Auto-dismiss after 8 seconds
    setTimeout(() => setShow(false), 8000);
  };

  return (
    <AnimatePresence>
      {show && summary && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm"
        >
          <div className="glass-card rounded-2xl p-4 shadow-xl border border-gold/20 bg-parchment/95 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center">
                  <Bell className="w-4 h-4 text-parchment" />
                </div>
                <div>
                  <h3
                    className="text-sm font-bold text-ink"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Welcome back!
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    {summary.total} unread notification{summary.total !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShow(false)}
                className="p-1 rounded-full text-ink-muted/40 hover:text-ink-muted hover:bg-cream/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary items */}
            <div className="space-y-1.5 mt-3">
              {summary.followers > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-ink">
                  <UserPlus className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  <span>
                    <strong>{summary.followers}</strong> new follower{summary.followers !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {summary.recommendations > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-ink">
                  <Gift className="w-3.5 h-3.5 text-rose flex-shrink-0" />
                  <span>
                    <strong>{summary.recommendations}</strong> new recommendation{summary.recommendations !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {summary.discussions > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-ink">
                  <MessageSquare className="w-3.5 h-3.5 text-gold-dark flex-shrink-0" />
                  <span>
                    <strong>{summary.discussions}</strong> reader{summary.discussions !== 1 ? 's' : ''} joined your discussion{summary.discussions !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {summary.badges > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-ink">
                  <Award className="w-3.5 h-3.5 text-amber flex-shrink-0" />
                  <span>
                    <strong>{summary.badges}</strong> new badge{summary.badges !== 1 ? 's' : ''} earned!
                  </span>
                </div>
              )}
              {summary.other > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-ink">
                  <Bell className="w-3.5 h-3.5 text-copper flex-shrink-0" />
                  <span>
                    <strong>{summary.other}</strong> other notification{summary.other !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Link to notifications */}
            <Link
              href="/notifications"
              onClick={() => setShow(false)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold-dark hover:text-gold transition-colors"
            >
              View all notifications →
            </Link>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-amber rounded-bl-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
