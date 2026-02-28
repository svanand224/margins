'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useBookStore } from '@/lib/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

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
    } catch (err) {
      console.error('Cloud load error:', err);
    }
  }, []);

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
    } catch (err) {
      console.error('Cloud save error:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

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
