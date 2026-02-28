'use client';

import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  BookOpen,
  Trophy,
  Star,
  Loader2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

interface PublicUser {
  id: string;
  reader_name: string;
  avatar_url: string | null;
  bio: string;
  favorite_genre: string;
  public_slug: string;
  reading_data: {
    books?: Book[];
  };
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load featured/recent public profiles on mount
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchPublicProfiles = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (data) {
        setUsers(data as PublicUser[]);
      }
      setLoading(false);
    };

    fetchPublicProfiles();
  }, []);

  // Search when query changes (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setUsers([]); // Show nothing until search
      setLoading(false);
      return;
    }
    setSearching(true);
    const fetchSearch = async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, reader_name, avatar_url, bio, favorite_genre, public_slug, reading_data')
        .eq('shelf_public', true)
        .not('public_slug', 'is', null)
        .or(`reader_name.ilike.%${query}%,public_slug.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(20);
      setUsers(data || []);
      setSearching(false);
    };
    fetchSearch();
  }, [query]);

  const getStats = (user: PublicUser) => {
    const books = user.reading_data?.books || [];
    const completed = books.filter((b) => b.status === 'completed').length;
    const avgRating =
      books.filter((b) => b.rating).length > 0
        ? books.reduce((sum, b) => sum + (b.rating || 0), 0) /
          books.filter((b) => b.rating).length
        : 0;
    return { total: books.length, completed, avgRating };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-gold" /> Discover Readers
      </h1>
      <div className="mb-8 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by username, handle, or bio..."
          className="flex-1 px-4 py-2 rounded-xl border border-gold-light/30 bg-cream/50 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        />
        <button
          className="px-4 py-2 rounded-xl bg-gold text-parchment font-semibold flex items-center gap-2 hover:bg-gold-dark transition-colors"
          disabled={searching}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading || searching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <User className="w-16 h-16 text-gold/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">No users found</h2>
          <p className="text-ink-muted mb-6">Try searching for a different username or bio.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {users.map(user => (
            <Link
              key={user.id}
              href={`/user/${user.public_slug}`}
              className="glass-card rounded-xl p-6 flex items-center gap-4 hover:ring-2 hover:ring-gold transition-all"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.reader_name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-gold to-amber text-parchment">
                  {user.reader_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink line-clamp-1">{user.reader_name}</h3>
                <p className="text-xs text-ink-muted line-clamp-1">@{user.public_slug}</p>
                {user.bio && <p className="text-xs text-ink-muted mt-1 line-clamp-2">{user.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
