'use client';

import { useState, useCallback } from 'react';
import { useBookStore } from '@/lib/store';
import { fetchBookByISBN, fetchBookByURL, searchBooks } from '@/lib/bookApi';
import { Book, ReadingStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Link2,
  Hash,
  PenTool,
  Loader2,
  Check,
  Plus,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MehndiDivider, LotusDivider, BlockPrintBorder } from '@/components/IndianPatterns';

type AddMode = 'search' | 'isbn' | 'url' | 'manual';

const genres = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
  'Fantasy', 'Horror', 'Historical Fiction', 'Literary Fiction', 'Biography',
  'Memoir', 'Self-Help', 'Science', 'History', 'Philosophy', 'Poetry',
  'Business', 'Psychology', 'Health', 'Travel', 'Cooking', 'Art',
  'Young Adult', 'Children', 'Comics', 'Religion', 'Technology', 'Other',
];

export default function AddBookPage() {
  const { addBook } = useBookStore();
  const router = useRouter();
  const [mode, setMode] = useState<AddMode>('search');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<Book>[]>([]);
  const [isbnInput, setIsbnInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Manual form state
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    totalPages: '',
    genre: 'Fiction',
    status: 'want-to-read' as ReadingStatus,
    notes: '',
    tags: '',
  });

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      if (results.length === 0) setError('No books found. Try a different search term.');
    } catch {
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  }, [searchQuery]);

  const handleISBN = useCallback(async () => {
    if (!isbnInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const book = await fetchBookByISBN(isbnInput.replace(/[-\s]/g, ''));
      if (book) {
        setForm({
          title: book.title || '',
          author: book.author || '',
          isbn: book.isbn || isbnInput,
          coverUrl: book.coverUrl || '',
          totalPages: String(book.totalPages || ''),
          genre: book.genre || 'Fiction',
          status: 'want-to-read',
          notes: book.notes || '',
          tags: '',
        });
        setMode('manual');
      } else {
        setError('Book not found. Try entering details manually.');
      }
    } catch {
      setError('Failed to fetch book. Please try again.');
    }
    setLoading(false);
  }, [isbnInput]);

  const handleURL = useCallback(async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const book = await fetchBookByURL(urlInput);
      if (book) {
        setForm({
          title: book.title || '',
          author: book.author || '',
          isbn: book.isbn || '',
          coverUrl: book.coverUrl || '',
          totalPages: String(book.totalPages || ''),
          genre: book.genre || 'Fiction',
          status: 'want-to-read',
          notes: book.notes || '',
          tags: '',
        });
        setMode('manual');
      } else {
        setError('Could not extract book info from URL. Try ISBN or manual entry.');
      }
    } catch {
      setError('Failed to process URL. Please try again.');
    }
    setLoading(false);
  }, [urlInput]);

  const selectSearchResult = (book: Partial<Book>) => {
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      coverUrl: book.coverUrl || '',
      totalPages: String(book.totalPages || ''),
      genre: book.genre || 'Fiction',
      status: 'want-to-read',
      notes: book.notes || '',
      tags: '',
    });
    setMode('manual');
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.');
      return;
    }
    const id = addBook({
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      coverUrl: form.coverUrl.trim(),
      totalPages: parseInt(form.totalPages) || 0,
      currentPage: 0,
      genre: form.genre,
      status: form.status,
      notes: form.notes.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setSuccess(true);
    setTimeout(() => router.push(`/book/${id}`), 1200);
  };

  const modes: { key: AddMode; icon: typeof Search; label: string; desc: string }[] = [
    { key: 'search', icon: Search, label: 'Search', desc: 'Find by title or author' },
    { key: 'isbn', icon: Hash, label: 'ISBN', desc: 'Look up by ISBN' },
    { key: 'url', icon: Link2, label: 'URL', desc: 'Import from Amazon' },
    { key: 'manual', icon: PenTool, label: 'Manual', desc: 'Enter details yourself' },
  ];

  if (success) {
    return (
      <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 max-w-2xl lg:max-w-3xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-20 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-forest to-sage mx-auto mb-6 flex items-center justify-center relative z-10"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-ink mb-2 relative z-10" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Book Added!
          </h2>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative z-10"
          >
            {/* Small animated lotus */}
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gold mx-auto mt-4">
              <ellipse cx="12" cy="12" rx="2.5" ry="6" fill="currentColor" fillOpacity="0.5" />
              <ellipse cx="12" cy="12" rx="2.5" ry="5.5" fill="currentColor" fillOpacity="0.4" transform="rotate(35 12 12)" />
              <ellipse cx="12" cy="12" rx="2.5" ry="5.5" fill="currentColor" fillOpacity="0.4" transform="rotate(-35 12 12)" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </motion.div>
          <p className="text-ink-muted mt-2 relative z-10">Redirecting to your book...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 max-w-2xl lg:max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <Plus className="w-8 h-8 text-amber" />
          Add a Book
        </h1>
        <p className="text-ink-muted mt-1">Add to your collection via search, ISBN, URL, or manual entry</p>
        <div className="mt-2">
          <MehndiDivider className="h-4 opacity-50" />
        </div>
      </motion.div>

      {/* Decorative lotus divider */}
      <div className="mb-6 -mt-2">
        <LotusDivider className="h-12 opacity-80" />
      </div>

      {/* Block print border */}
      <div className="mb-6 -mt-4">
        <BlockPrintBorder className="h-6 opacity-50" />
      </div>

      {/* Mode selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6"
      >
        {modes.map((m) => (
          <motion.button
            key={m.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode(m.key); setError(''); }}
            className={`
              p-3 rounded-xl border text-left transition-all
              ${mode === m.key
                ? 'bg-gradient-to-br from-gold/10 to-amber/10 border-gold/30 shadow-sm'
                : 'bg-cream/30 border-gold-light/20 hover:border-gold-light/40'}
            `}
          >
            <m.icon className={`w-5 h-5 mb-1 ${mode === m.key ? 'text-gold-dark' : 'text-ink-muted'}`} />
            <p className={`text-sm font-medium ${mode === m.key ? 'text-ink' : 'text-ink-muted'}`}>{m.label}</p>
            <p className="text-[10px] md:text-xs text-ink-muted">{m.desc}</p>
          </motion.button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Search Mode */}
        {mode === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for a book title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </motion.button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted">{searchResults.length} results found — tap to select</p>
                {searchResults.map((book, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => selectSearchResult(book)}
                    className="w-full text-left glass-card rounded-xl p-3 flex gap-3 hover:bg-gold-light/10 transition-colors"
                  >
                    <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-bark to-espresso overflow-hidden flex-shrink-0">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-gold-light/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{book.title}</p>
                      <p className="text-xs text-ink-muted truncate">{book.author}</p>
                      <p className="text-[10px] md:text-xs text-ink-muted/60">{book.totalPages ? `${book.totalPages} pages` : ''} {book.genre ? `· ${book.genre}` : ''}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ISBN Mode */}
        {mode === 'isbn' && (
          <motion.div
            key="isbn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter ISBN (10 or 13 digits)..."
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleISBN()}
                className="flex-1 px-4 py-3 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleISBN}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look Up'}
              </motion.button>
            </div>
            <p className="text-xs text-ink-muted">Find the ISBN on the back cover of most books, near the barcode.</p>
          </motion.div>
        )}

        {/* URL Mode */}
        {mode === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste an Amazon book URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleURL()}
                className="flex-1 px-4 py-3 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleURL}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
              </motion.button>
            </div>
            <p className="text-xs text-ink-muted">Currently only <strong>Amazon</strong> book links are supported. Copy the URL from a book's Amazon page.</p>
          </motion.div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Cover preview */}
            {form.coverUrl && (
              <div className="flex justify-center mb-4">
                <div className="w-24 h-36 rounded-xl overflow-hidden shadow-lg">
                  <img src={form.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Book title"
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Author *</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Author name"
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Total Pages</label>
                <input
                  type="number"
                  value={form.totalPages}
                  onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                  placeholder="350"
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Genre</label>
                <select
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                >
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">ISBN</label>
                <input
                  type="text"
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  placeholder="978-..."
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ReadingStatus })}
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                >
                  <option value="want-to-read">Want to Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed</option>
                  <option value="dnf">Did Not Finish</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="classic, favorites, book-club"
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this book..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-gold to-amber text-white rounded-xl font-medium shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Add to Library
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
