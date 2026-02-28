'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface UserProfile {
  id: string;
  reader_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string;
  favorite_genre: string;
  public_slug: string | null;
  shelf_public: boolean;
  created_at: string;
  updated_at: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(
    isSupabaseConfigured() ? createClient() : null
  );

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabaseRef.current) return;
    const { data } = await supabaseRef.current
      .from('profiles')
      .select('id, reader_name, email, avatar_url, bio, favorite_genre, public_slug, shelf_public, created_at, updated_at')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data as UserProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      fetchProfile(user.id); // Don't await, fetch in background
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabaseRef.current) return;
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    if (!supabaseRef.current) {
      setLoading(false);
      return;
    }
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabaseRef.current!.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false); // UI is ready instantly
      if (currentUser) {
        fetchProfile(currentUser.id); // Fetch profile in background
      }
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseRef.current!.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false); // UI is ready instantly
        if (currentUser) {
          fetchProfile(currentUser.id); // Fetch profile in background
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
