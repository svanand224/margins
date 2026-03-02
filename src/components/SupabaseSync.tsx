'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useBookStore } from '@/lib/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Book } from '@/lib/types';

// Compute which achievement IDs are currently unlocked from books array
function getUnlockedBadges(books: Book[]): string[] {
  const completed = books.filter(b => b.status === 'completed');
  const genres = new Set(completed.map(b => b.genre));
  const totalPages = books.reduce((s, b) => s + b.currentPage, 0);
  const favorites = books.filter(b => b.favorite);
  const totalSessions = books.reduce((s, b) => s + (b.sessions?.length || 0), 0);

  const badges: { id: string; label: string; unlocked: boolean }[] = [
    { id: 'first-book', label: 'First Bloom', unlocked: completed.length >= 1 },
    { id: 'bookworm', label: 'Bookworm', unlocked: completed.length >= 10 },
    { id: 'scholar', label: 'Scholar', unlocked: completed.length >= 25 },
    { id: 'bibliophile', label: 'Bibliophile', unlocked: completed.length >= 50 },
    { id: 'centurion', label: 'Centurion', unlocked: completed.length >= 100 },
    { id: 'explorer', label: 'Explorer', unlocked: genres.size >= 5 },
    { id: 'renaissance', label: 'Renaissance', unlocked: genres.size >= 10 },
    { id: 'page-turner', label: 'Page Turner', unlocked: totalPages >= 1000 },
    { id: 'marathon', label: 'Marathon', unlocked: totalPages >= 10000 },
    { id: 'curator', label: 'Curator', unlocked: favorites.length >= 5 },
    { id: 'dedicated', label: 'Dedicated', unlocked: totalSessions >= 30 },
    { id: 'collector', label: 'Collector', unlocked: books.length >= 20 },
  ];

  return badges.filter(b => b.unlocked).map(b => b.id);
}

// Badge label map for notification messages
const badgeLabels: Record<string, string> = {
  'first-book': 'First Bloom',
  'bookworm': 'Bookworm',
  'scholar': 'Scholar',
  'bibliophile': 'Bibliophile',
  'centurion': 'Centurion',
  'explorer': 'Explorer',
  'renaissance': 'Renaissance',
  'page-turner': 'Page Turner',
  'marathon': 'Marathon',
  'curator': 'Curator',
  'dedicated': 'Dedicated',
  'collector': 'Collector',
};

/**
 * SupabaseSync — bridges Supabase ↔ Zustand store
 *
 * On login:  loads reading_data from Supabase → hydrates store
 * On change: debounce-saves store snapshot → Supabase
 * On logout: clears store
 */
export default function SupabaseSync() {
  const { user, profile } = useAuth();
  const supabaseRef = useRef(
    isSupabaseConfigured() ? createClient() : null
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  const isSavingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Check for newly unlocked badges and create notifications
  const checkBadgeNotifications = useCallback(async (userId: string) => {
    if (!supabaseRef.current) return;
    const books = useBookStore.getState().books;
    if (!books.length) return;

    const unlockedNow = getUnlockedBadges(books);
    if (unlockedNow.length === 0) return;

    // Get previously notified badges from localStorage
    const storageKey = `badges-notified-${userId}`;
    let previouslyNotified: string[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) previouslyNotified = JSON.parse(stored);
    } catch { /* ignore */ }

    const newBadges = unlockedNow.filter(id => !previouslyNotified.includes(id));
    if (newBadges.length === 0) return;

    // Create a notification for each new badge
    for (const badgeId of newBadges) {
      await supabaseRef.current.from('notifications').insert({
        user_id: userId,
        type: 'badge_unlocked',
        from_user_id: null,
        data: { badge_id: badgeId, badge_label: badgeLabels[badgeId] || badgeId },
      });
    }

    // Update localStorage so we don't notify again
    try {
      localStorage.setItem(storageKey, JSON.stringify(unlockedNow));
    } catch { /* ignore */ }
  }, []);

  // Load data from Supabase into the store
  const loadFromCloud = useCallback(async (userId: string) => {
    if (!supabaseRef.current) return;
    try {
      const { data, error } = await supabaseRef.current
        .from('profiles')
        .select('reading_data, reader_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load cloud data:', error);
        return;
      }

      // Always clear before loading — so a new user starts fresh
      useBookStore.getState().clearStore();

      if (data?.reading_data && typeof data.reading_data === 'object') {
        const rd = data.reading_data as Record<string, unknown>;

        // Hydrate store from cloud data (empty arrays for new users)
        useBookStore.setState({
          books: Array.isArray(rd.books) ? rd.books : [],
          goals: Array.isArray(rd.goals) ? rd.goals : [],
          dailyLogs: Array.isArray(rd.dailyLogs) ? rd.dailyLogs : [],
          threads: Array.isArray(rd.threads) ? rd.threads : [],
          readerName: data.reader_name || '',
        });
      }

      hasLoadedRef.current = true;

      // Check for new badge unlocks after loading data
      checkBadgeNotifications(userId);
    } catch (err) {
      console.error('Cloud load error:', err);
    }
  }, [checkBadgeNotifications]);

  // Save store snapshot to Supabase
  const saveToCloud = useCallback(async (userId: string) => {
    if (isSavingRef.current || !supabaseRef.current) return;
    isSavingRef.current = true;

    try {
      const state = useBookStore.getState();
      const readingData = {
        books: state.books,
        goals: state.goals,
        dailyLogs: state.dailyLogs,
        threads: state.threads,
      };

      await supabaseRef.current
        .from('profiles')
        .update({
          reading_data: readingData,
          reader_name: state.readerName,
        })
        .eq('id', userId);

      // Check for new badge unlocks after save
      checkBadgeNotifications(userId);
    } catch (err) {
      console.error('Cloud save error:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [checkBadgeNotifications]);

  // Debounced save (2 seconds after last change)
  const debouncedSave = useCallback(
    (userId: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToCloud(userId);
      }, 2000);
    },
    [saveToCloud]
  );

  // Load from cloud when user logs in, or clear when user switches/logs out
  useEffect(() => {
    if (user) {
      // Detect user switch or first load
      if (currentUserIdRef.current !== user.id || !hasLoadedRef.current) {
        hasLoadedRef.current = false;
        currentUserIdRef.current = user.id;
        loadFromCloud(user.id);
      }
    } else {
      // User logged out — clear everything
      if (currentUserIdRef.current) {
        useBookStore.getState().clearStore();
        currentUserIdRef.current = null;
      }
      hasLoadedRef.current = false;
    }
  }, [user, loadFromCloud]);

  // Set reader name from profile
  useEffect(() => {
    if (profile?.reader_name) {
      useBookStore.setState({ readerName: profile.reader_name });
    }
  }, [profile]);

  // Subscribe to store changes and sync to cloud
  useEffect(() => {
    if (!user) return;

    const unsub = useBookStore.subscribe(() => {
      if (hasLoadedRef.current) {
        debouncedSave(user.id);
      }
    });

    return () => {
      unsub();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, debouncedSave]);

  // Flush pending saves on unmount / before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Use sendBeacon for reliable save on page close
        const state = useBookStore.getState();
        const readingData = {
          books: state.books,
          goals: state.goals,
          dailyLogs: state.dailyLogs,
          threads: state.threads,
        };
        // sendBeacon doesn't support auth headers, so we do a sync save
        saveToCloud(user.id);
        // Also store to localStorage as a fallback
        try {
          localStorage.setItem(
            'reading-tracker-pending-save',
            JSON.stringify({ userId: user.id, readingData })
          );
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, saveToCloud]);

  return null; // This is a logic-only component
}
