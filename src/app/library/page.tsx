'use client';

import { useBookStore } from '@/lib/store';
import { Book, ReadingStatus, SortOption, ViewMode } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Heart,
  ChevronDown,
  X,
  SortAsc,
  Library,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const statusLabels: Record<ReadingStatus | 'all', string> = {
  all: 'All Books',
  reading: 'Currently Reading',
  'want-to-read': 'Want to Read',
  completed: 'Completed',
  dnf: 'Did Not Finish',
};

const statusColors: Record<ReadingStatus, string> = {
  reading: 'bg-forest/10 text-forest border-forest/20',
  'want-to-read': 'bg-teal/10 text-teal border-teal/20',
  completed: 'bg-gold/10 text-gold-dark border-gold/20',
  dnf: 'bg-rose/10 text-rose border-rose/20',
};

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-muted">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const { books, toggleFavorite } = useBookStore();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as ReadingStatus | null) || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>(initialStatus);
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const genres = useMemo(() => {
    const genreSet = new Set(books.map(b => b.genre).filter(Boolean));
    return Array.from(genreSet).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q) ||
          b.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    // Genre filter
    if (genreFilter !== 'all') {
      result = result.filter(b => b.genre === genreFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'progress':
          return (b.totalPages > 0 ? b.currentPage / b.totalPages : 0) - (a.totalPages > 0 ? a.currentPage / a.totalPages : 0);
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

    return result;
  }, [books, searchQuery, statusFilter, genreFilter, sortBy]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Library className="w-8 h-8 text-gold" />
          My Library
        </h1>
        <p className="text-ink-muted mt-1">{books.length} books in your collection</p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 space-y-3"
      >
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by title, author, genre, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink placeholder:text-ink-muted/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gold-light/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-ink-muted" />
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
            {(Object.keys(statusLabels) as (ReadingStatus | 'all')[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${statusFilter === status
                    ? 'bg-gold text-white shadow-sm'
                    : 'bg-cream/50 text-ink-muted hover:bg-gold-light/20 border border-gold-light/20'}
                `}
              >
                {statusLabels[status]}
                {status !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({books.filter(b => b.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* View & Sort controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-gold/10 border-gold/20 text-gold-dark' : 'border-gold-light/20 text-ink-muted hover:bg-cream'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-gold/10 border-gold/20 text-gold-dark' : 'border-gold-light/20 text-ink-muted hover:bg-cream'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-gold/10 border-gold/20 text-gold-dark' : 'border-gold-light/20 text-ink-muted hover:bg-cream'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-ink-muted" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm bg-cream/50 border border-gold-light/30 rounded-lg px-3 py-1.5 text-ink"
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="rating">Rating</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
                {genres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-ink-muted" />
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="text-sm bg-cream/50 border border-gold-light/30 rounded-lg px-3 py-1.5 text-ink"
                    >
                      <option value="all">All Genres</option>
                      {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-3'
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book, i) => {
              // Count related books (same genre or shared tags)
              const relatedCount = books.filter(b => b.id !== book.id && (
                (b.genre && b.genre === book.genre) ||
                b.tags.some(t => book.tags.includes(t))
              )).length;

              return viewMode === 'grid' ? (
                <GridBookCard key={book.id} book={book} index={i} onToggleFavorite={toggleFavorite} relatedCount={relatedCount} />
              ) : (
                <ListBookCard key={book.id} book={book} index={i} onToggleFavorite={toggleFavorite} relatedCount={relatedCount} />
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <BookOpen className="w-16 h-16 text-gold-light/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {books.length === 0 ? 'Your library is empty' : 'No books match your filters'}
          </h3>
          <p className="text-ink-muted text-sm mb-4">
            {books.length === 0
              ? 'Start building your collection!'
              : 'Try adjusting your search or filters.'}
          </p>
          {books.length === 0 && (
            <Link href="/add">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium shadow-lg shadow-gold/20"
              >
                Add Your First Book
              </motion.button>
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}

function GridBookCard({ book, index, onToggleFavorite, relatedCount }: { book: Book; index: number; onToggleFavorite: (id: string) => void; relatedCount: number }) {
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/book/${book.id}`}>
        <div className="book-card group cursor-pointer">
          {/* Cover */}
          <div className="book-cover-glow relative w-full aspect-[2/3] rounded-xl bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-lg mb-2">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-gold-light/30 mx-auto mb-2" />
                  <p className="text-gold-light/50 text-xs leading-tight">{book.title}</p>
                </div>
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Status badge */}
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[book.status]}`}>
              {book.status === 'want-to-read' ? 'TBR' : book.status === 'reading' ? 'Reading' : book.status === 'completed' ? 'Done' : 'DNF'}
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(book.id);
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart
                className={`w-3.5 h-3.5 ${book.favorite ? 'text-rose fill-rose' : 'text-white'}`}
              />
            </button>

            {/* Progress bar at bottom */}
            {book.status === 'reading' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div
                  className="h-full bg-gradient-to-r from-gold to-amber"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="text-sm font-semibold text-ink truncate">{book.title}</h3>
          <p className="text-xs text-ink-muted truncate">{book.author}</p>
          {book.rating && (
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s < book.rating! ? 'text-gold fill-gold' : 'text-gold-light/30'}`}
                />
              ))}
            </div>
          )}
          {relatedCount > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-ink-muted/60">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5 C3 2, 7 2, 10 5" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
              {relatedCount} thread{relatedCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function ListBookCard({ book, index, onToggleFavorite, relatedCount }: { book: Book; index: number; onToggleFavorite: (id: string) => void; relatedCount: number }) {
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/book/${book.id}`}>
        <div className="book-card glass-card rounded-xl p-3 flex gap-4 cursor-pointer">
          <div className="book-cover-glow w-12 h-18 rounded-lg bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-md flex-shrink-0">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-gold-light/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink truncate">{book.title}</h3>
                <p className="text-xs text-ink-muted truncate">{book.author} · {book.genre}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[book.status]}`}>
                  {statusLabels[book.status].replace('Currently ', '')}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(book.id);
                  }}
                  className="p-1"
                >
                  <Heart className={`w-3.5 h-3.5 ${book.favorite ? 'text-rose fill-rose' : 'text-ink-muted/30'}`} />
                </button>
              </div>
            </div>
            {book.status === 'reading' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-ink-muted mb-0.5">
                  <span>Page {book.currentPage}/{book.totalPages}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold to-amber rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {book.rating && (
              <div className="flex gap-0.5 mt-1.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`w-3 h-3 ${s < book.rating! ? 'text-gold fill-gold' : 'text-gold-light/30'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
