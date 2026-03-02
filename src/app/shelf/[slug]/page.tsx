'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Star,
  Trophy,
  Library,
  Flame,
  ArrowLeft,
  Loader2,
  Clock,
  Bookmark,
  Share2,
  Copy,
  Check,
  BookMarked,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Book } from '@/lib/types';
import LotusLogo from '@/components/LotusLogo';

const accentThemes: Record<string, { accent: string; accentLight: string }> = {
  gold: { accent: 'var(--th-gold)', accentLight: 'var(--th-gold-light)' },
  teal: { accent: '#0d9488', accentLight: '#99f6e4' },
  rose: { accent: '#e11d48', accentLight: '#fecdd3' },
  forest: { accent: '#059669', accentLight: '#a7f3d0' },
  purple: { accent: '#7c3aed', accentLight: '#ddd6fe' },
  copper: { accent: '#c2410c', accentLight: '#fed7aa' },
};

interface PublicProfile {
  reader_name: string;
  bio: string;
  avatar_url: string | null;
  favorite_genre: string;
  reading_data: { books?: Book[] };
  created_at: string;
  shelf_accent_color: string | null;
  shelf_show_currently_reading: boolean | null;
  shelf_show_stats: boolean | null;
  shelf_featured_book_ids: string[] | null;
  shelf_bio_override: string | null;
}

export default function PublicShelfPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'completed' | 'tbr'>('all');

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured()) { setNotFound(true); setLoading(false); return; }
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('reader_name, bio, avatar_url, favorite_genre, reading_data, created_at, shelf_accent_color, shelf_show_currently_reading, shelf_show_stats, shelf_featured_book_ids, shelf_bio_override')
        .eq('public_slug', slug)
        .eq('shelf_public', true)
        .single();
      if (error || !data) { setNotFound(true); } else { setProfile(data as PublicProfile); }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <LotusLogo className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Shelf Not Found</h1>
          <p className="text-ink-muted text-sm mb-6">This bookshelf doesn&apos;t exist or is set to private.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gold-dark hover:text-gold transition-colors"><ArrowLeft className="w-4 h-4" /> Go to Margins</Link>
        </div>
      </div>
    );
  }

  const theme = accentThemes[profile.shelf_accent_color || 'gold'] || accentThemes.gold;
  const showCurrentlyReading = profile.shelf_show_currently_reading !== false;
  const showStats = profile.shelf_show_stats !== false;
  const displayBio = profile.shelf_bio_override || profile.bio;
  const books: Book[] = profile.reading_data?.books || [];
  const completed = books.filter(b => b.status === 'completed');
  const reading = books.filter(b => b.status === 'reading');
  const wantToRead = books.filter(b => b.status === 'want-to-read');
  const totalPages = books.reduce((sum, b) => sum + b.currentPage, 0);
  const avgRating = completed.filter(b => b.rating).length > 0
    ? (completed.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) / completed.filter(b => b.rating).length).toFixed(1) : null;
  const featured = (profile.shelf_featured_book_ids || []).map(id => completed.find(b => b.id === id)).filter(Boolean) as Book[];
  const filteredBooks = activeTab === 'all' ? books : activeTab === 'reading' ? reading : activeTab === 'completed' ? completed : wantToRead;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Header */}
      <div className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.accentLight}22 0%, transparent 100%)` }} />
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-parchment/80 backdrop-blur-sm border border-gold-light/30 text-ink-muted hover:text-ink transition-colors z-10">
          {copied ? <Check className="w-3.5 h-3.5 text-forest" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </motion.button>

        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block mb-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.reader_name} className="w-24 h-24 rounded-full object-cover shadow-lg" style={{ borderWidth: 4, borderStyle: 'solid', borderColor: theme.accent }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`, color: 'white' }}>
              {profile.reader_name.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {profile.reader_name}&apos;s Library
        </motion.h1>

        {displayBio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-ink-muted text-sm italic max-w-md mx-auto mb-4">{displayBio}</motion.p>
        )}

        {showStats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 sm:gap-6 text-sm text-ink-muted bg-parchment/60 backdrop-blur-sm rounded-full px-5 py-2.5 border border-gold-light/20">
            <div className="flex items-center gap-1.5"><Library className="w-4 h-4" style={{ color: theme.accent }} /><span className="font-medium text-ink">{books.length}</span><span className="hidden sm:inline">books</span></div>
            <div className="w-px h-4 bg-gold-light/30" />
            <div className="flex items-center gap-1.5"><Trophy className="w-4 h-4" style={{ color: theme.accent }} /><span className="font-medium text-ink">{completed.length}</span><span className="hidden sm:inline">read</span></div>
            <div className="w-px h-4 bg-gold-light/30" />
            <div className="flex items-center gap-1.5"><Flame className="w-4 h-4" style={{ color: theme.accent }} /><span className="font-medium text-ink">{totalPages.toLocaleString()}</span><span className="hidden sm:inline">pages</span></div>
            {avgRating && (<><div className="w-px h-4 bg-gold-light/30" /><div className="flex items-center gap-1.5"><Star className="w-4 h-4" style={{ color: theme.accent }} /><span className="font-medium text-ink">{avgRating}</span><span className="hidden sm:inline">avg</span></div></>)}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 flex items-center justify-center gap-1.5 opacity-30">
          <LotusLogo className="w-4 h-4" /><span className="text-xs text-ink-muted">Margins</span>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Currently Reading */}
        {showCurrentlyReading && reading.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              <Clock className="w-5 h-5" style={{ color: theme.accent }} /> Currently Reading
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reading.map((book, i) => {
                const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
                return (
                  <motion.div key={book.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="glass-card rounded-xl p-4 flex gap-3">
                    <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-bark to-espresso">
                      {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-gold-light/40" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ink truncate">{book.title}</h3>
                      <p className="text-xs text-ink-muted truncate">{book.author}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] md:text-xs text-ink-muted mb-1"><span>Page {book.currentPage}/{book.totalPages}</span><span>{progress}%</span></div>
                        <div className="h-1.5 bg-cream/80 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})` }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <h2 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              <Star className="w-5 h-5" style={{ color: theme.accent }} /> Featured Reads
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {featured.map((book, i) => (
                <motion.div key={book.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="glass-card rounded-xl overflow-hidden" style={{ borderWidth: 1, borderStyle: 'solid', borderColor: `${theme.accent}33` }}>
                  <div className="aspect-[2/3] bg-cream/50 relative">
                    {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gold-light/30" /></div>}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] md:text-[11px] font-bold" style={{ background: theme.accent, color: 'white' }}>★ Featured</div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-ink line-clamp-1">{book.title}</p>
                    <p className="text-[10px] md:text-xs text-ink-muted">{book.author}</p>
                    {book.rating && <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5" style={{ color: i < book.rating! ? theme.accent : `${theme.accent}33`, fill: i < book.rating! ? theme.accent : 'none' }} />)}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Tab filter */}
        <div className="flex items-center gap-2 border-b border-gold-light/20 overflow-x-auto">
          {([
            { key: 'all' as const, label: `All (${books.length})`, icon: Library },
            { key: 'reading' as const, label: `Reading (${reading.length})`, icon: BookOpen },
            { key: 'completed' as const, label: `Completed (${completed.length})`, icon: Trophy },
            { key: 'tbr' as const, label: `TBR (${wantToRead.length})`, icon: Bookmark },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'text-ink border-current' : 'text-ink-muted border-transparent hover:text-ink hover:border-gold-light/40'}`}
              style={activeTab === tab.key ? { borderColor: theme.accent } : undefined}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {/* Book Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredBooks.map((book, i) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-card rounded-xl overflow-hidden group">
                <div className="aspect-[2/3] relative bg-cream/50">
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-2"><p className="text-[10px] md:text-xs text-ink-muted text-center line-clamp-3">{book.title}</p></div>}
                  {book.status === 'reading' && book.totalPages > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-cream/50">
                      <div className="h-full rounded-r-full" style={{ width: `${Math.min(100, (book.currentPage / book.totalPages) * 100)}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})` }} />
                    </div>
                  )}
                  {book.status === 'completed' && <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: theme.accent }}><Check className="w-3 h-3 text-white" /></div>}
                </div>
                <div className="p-2">
                  <p className="text-[11px] md:text-xs font-medium text-ink line-clamp-1">{book.title}</p>
                  <p className="text-[10px] md:text-xs text-ink-muted line-clamp-1">{book.author}</p>
                  {book.rating && <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2" style={{ color: i < book.rating! ? theme.accent : `${theme.accent}33`, fill: i < book.rating! ? theme.accent : 'none' }} />)}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16"><BookOpen className="w-12 h-12 mx-auto mb-4 text-ink-muted opacity-30" /><p className="text-ink-muted">No books in this category.</p></div>
        )}
      </div>
    </div>
  );
}
