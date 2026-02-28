'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Star,
  Trophy,
  Library,
  Flame,
  User,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Book } from '@/lib/types';
import LotusLogo from '@/components/LotusLogo';

interface PublicProfile {
  reader_name: string;
  bio: string;
  avatar_url: string | null;
  favorite_genre: string;
  reading_data: {
    books?: Book[];
  };
  created_at: string;
}

export default function PublicShelfPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('reader_name, bio, avatar_url, favorite_genre, reading_data, created_at')
        .eq('public_slug', slug)
        .eq('shelf_public', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as PublicProfile);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <LotusLogo className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h1
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Shelf Not Found
          </h1>
          <p className="text-ink-muted text-sm mb-6">
            This bookshelf doesn&apos;t exist or is set to private.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gold-dark hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Margins
          </Link>
        </div>
      </div>
    );
  }

  const books: Book[] = profile.reading_data?.books || [];
  const completed = books.filter((b) => b.status === 'completed');
  const reading = books.filter((b) => b.status === 'reading');
  const wantToRead = books.filter((b) => b.status === 'want-to-read');
  const totalPages = books.reduce((sum, b) => sum + b.currentPage, 0);
  const avgRating = completed.filter(b => b.rating).length > 0
    ? (completed.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) /
       completed.filter(b => b.rating).length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-8 text-center"
        style={{ background: 'linear-gradient(180deg, var(--th-cream) 0%, var(--th-parchment) 100%)' }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block mb-4"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.reader_name}
              className="w-24 h-24 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor: 'var(--th-gold-light)' }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                color: 'var(--th-parchment)',
                borderColor: 'var(--th-gold-light)',
              }}
            >
              {profile.reader_name.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-ink mb-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {profile.reader_name}&apos;s Bookshelf
        </motion.h1>

        {profile.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-ink-muted text-sm italic max-w-md mx-auto mb-3"
          >
            {profile.bio}
          </motion.p>
        )}

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 text-sm text-ink-muted"
        >
          <div className="flex items-center gap-1.5">
            <Library className="w-4 h-4" style={{ color: 'var(--th-gold)' }} />
            <span>{books.length} books</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" style={{ color: 'var(--th-forest)' }} />
            <span>{completed.length} read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4" style={{ color: 'var(--th-copper)' }} />
            <span>{totalPages.toLocaleString()} pages</span>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4" style={{ color: 'var(--th-gold-dark)' }} />
              <span>{avgRating} avg</span>
            </div>
          )}
        </motion.div>

        {/* Margins branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center justify-center gap-1.5 opacity-40"
        >
          <LotusLogo className="w-4 h-4" />
          <span className="text-xs text-ink-muted">Margins</span>
        </motion.div>
      </div>

      {/* Book Sections */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-10">
        {/* Currently Reading */}
        {reading.length > 0 && (
          <BookSection title="Currently Reading" icon={BookOpen} books={reading} color="var(--th-amber)" />
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <BookSection title="Completed" icon={Trophy} books={completed} color="var(--th-forest)" showRating />
        )}

        {/* Want to Read */}
        {wantToRead.length > 0 && (
          <BookSection title="Want to Read" icon={Star} books={wantToRead} color="var(--th-gold)" />
        )}

        {/* Empty state */}
        {books.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-ink-muted opacity-30" />
            <p className="text-ink-muted">This shelf is empty — for now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookSection({
  title,
  icon: Icon,
  books,
  color,
  showRating = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  books: Book[];
  color: string;
  showRating?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color }} />
        <h2
          className="text-xl font-semibold text-ink"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {title}
        </h2>
        <span className="text-xs text-ink-muted">({books.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-xl overflow-hidden group"
          >
            {/* Cover */}
            <div className="aspect-[2/3] relative bg-cream/50">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3">
                  <div className="text-center">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gold-light" />
                    <p className="text-xs text-ink-muted font-medium line-clamp-2">{book.title}</p>
                  </div>
                </div>
              )}
              {/* Progress overlay for reading books */}
              {book.status === 'reading' && book.totalPages > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-cream/50">
                  <div
                    className="h-full rounded-r-full"
                    style={{
                      width: `${Math.min(100, (book.currentPage / book.totalPages) * 100)}%`,
                      background: `linear-gradient(90deg, var(--th-gold), var(--th-amber))`,
                    }}
                  />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-ink line-clamp-1" title={book.title}>
                {book.title}
              </p>
              <p className="text-xs text-ink-muted line-clamp-1">{book.author}</p>
              {showRating && book.rating && (
                <div className="flex items-center gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3"
                      style={{
                        color: i < book.rating! ? 'var(--th-gold)' : 'var(--th-gold-light)',
                        fill: i < book.rating! ? 'var(--th-gold)' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
