'use client';

import { useBookStore } from '@/lib/store';
import { ReadingStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  Heart,
  Star,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  BookMarked,
} from 'lucide-react';
import { MessageCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Confetti from '@/components/Confetti';
import { MehndiDivider, LotusDivider, OrnateFrame, BlockPrintBorder, LotusProgressBar } from '@/components/IndianPatterns';
import { useAuth } from '@/lib/auth';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const statusLabels: Record<ReadingStatus, string> = {
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

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { books, updateBook, updateProgress, updateStatus, toggleFavorite, addSession, deleteSession, deleteBook } = useBookStore();
  const book = books.find(b => b.id === params.id);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionPages, setSessionPages] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatusRef = useRef(book?.status);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    totalPages: '',
    genre: '',
    notes: '',
    tags: '',
  });

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Horror', 'Historical Fiction', 'Literary Fiction', 'Biography',
    'Memoir', 'Self-Help', 'Science', 'History', 'Philosophy', 'Poetry',
    'Business', 'Psychology', 'Health', 'Travel', 'Cooking', 'Art',
    'Young Adult', 'Children', 'Comics', 'Religion', 'Technology', 'Other',
  ];

  const startEditing = useCallback(() => {
    if (!book) return;
    setEditForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      coverUrl: book.coverUrl || '',
      totalPages: String(book.totalPages),
      genre: book.genre,
      notes: book.notes || '',
      tags: book.tags.join(', '),
    });
    setIsEditing(true);
  }, [book]);

  const handleSaveEdit = useCallback(() => {
    if (!book) return;
    if (!editForm.title.trim() || !editForm.author.trim()) return;
    updateBook(book.id, {
      title: editForm.title.trim(),
      author: editForm.author.trim(),
      isbn: editForm.isbn.trim() || undefined,
      coverUrl: editForm.coverUrl.trim() || undefined,
      totalPages: parseInt(editForm.totalPages) || book.totalPages,
      genre: editForm.genre,
      notes: editForm.notes.trim() || undefined,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  }, [book, editForm, updateBook]);

  // Wrapper to detect completion and trigger confetti
  const handleStatusChange = useCallback((status: ReadingStatus) => {
    if (!book) return;
    const wasNotCompleted = book.status !== 'completed';
    updateStatus(book.id, status);
    if (status === 'completed' && wasNotCompleted) {
      setShowConfetti(true);
    }
  }, [book, updateStatus]);

  const handleProgressWithConfetti = useCallback((id: string, page: number) => {
    if (!book) return;
    const wasNotCompleted = book.status !== 'completed';
    const willComplete = page >= book.totalPages && book.status === 'reading';
    updateProgress(id, page);
    if (willComplete && wasNotCompleted) {
      setShowConfetti(true);
    }
  }, [book, updateProgress]);

  if (!book) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center py-20">
        <BookOpen className="w-16 h-16 text-gold-light/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Book not found
        </h2>
        <p className="text-ink-muted mb-4">This book may have been removed.</p>
        <Link href="/library">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium"
          >
            Back to Library
          </motion.button>
        </Link>
      </div>
    );
  }

  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  const pagesLeft = book.totalPages - book.currentPage;
  const totalSessionMinutes = book.sessions.reduce((s, sess) => s + sess.minutesSpent, 0);
  const totalSessionPages = book.sessions.reduce((s, sess) => s + sess.pagesRead, 0);
  const avgPagesPerSession = book.sessions.length > 0 ? Math.round(totalSessionPages / book.sessions.length) : 0;

  const handleUpdateProgress = () => {
    const page = parseInt(progressInput);
    if (!isNaN(page) && page >= 0 && page <= book.totalPages) {
      handleProgressWithConfetti(book.id, page);
      setEditingProgress(false);
    }
  };

  const handleQuickProgress = (delta: number) => {
    const newPage = Math.min(Math.max(book.currentPage + delta, 0), book.totalPages);
    handleProgressWithConfetti(book.id, newPage);
  };

  const handleAddSession = () => {
    const pages = parseInt(sessionPages);
    const minutes = parseInt(sessionMinutes);
    if (isNaN(pages) || pages <= 0) return;
    addSession(book.id, {
      date: new Date().toISOString(),
      pagesRead: pages,
      minutesSpent: minutes || 0,
      notes: sessionNotes.trim() || undefined,
    });
    // Also advance page
    const newPage = Math.min(book.currentPage + pages, book.totalPages);
    handleProgressWithConfetti(book.id, newPage);
    setSessionPages('');
    setSessionMinutes('');
    setSessionNotes('');
    setShowSessionForm(false);
  };

  const handleRate = (r: number) => {
    setRating(r);
    updateBook(book.id, { rating: r });
  };

  const handleSaveReview = () => {
    updateBook(book.id, { review: reviewText.trim() });
    setShowReviewForm(false);
  };

  const handleDelete = () => {
    deleteBook(book.id);
    router.push('/library');
  };

  const { user } = useAuth();
  type BookComment = {
    id: string;
    content: string;
    created_at: string;
    author: {
      id: string;
      reader_name: string;
      avatar_url: string | null;
      public_slug: string;
    };
  };
  const [comments, setComments] = useState<BookComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('book_comments')
        .select('id, content, created_at, author:author_id (id, reader_name, avatar_url, public_slug)')
        .eq('book_id', params.id)
        .order('created_at', { ascending: false });
      // Fix author shape if it's an array
      const fixedData = (data || []).map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
      }));
      setComments(fixedData);
    };
    fetchComments();
  }, [params.id]);

  const handlePostComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommentLoading(true);
    const supabase = createClient();
    await supabase
      .from('book_comments')
      .insert({
        book_id: params.id,
        author_id: user.id,
        content: commentText.trim(),
      });
    setCommentText('');
    setCommentLoading(false);
    // Refresh comments
    const { data } = await supabase
      .from('book_comments')
      .select('id, content, created_at, author:author_id (id, reader_name, avatar_url, public_slug)')
      .eq('book_id', params.id)
      .order('created_at', { ascending: false });
    const fixedData = (data || []).map((c: any) => ({
      ...c,
      author: Array.isArray(c.author) ? c.author[0] : c.author,
    }));
    setComments(fixedData);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      {/* Back navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </motion.div>

      {/* Book Discussion Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 mb-8 border-2 border-gold-light/30 bg-gradient-to-br from-amber/5 to-parchment/10"
      >
        <h2 className="text-xl font-bold text-forest mb-2 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <MessageCircle className="w-6 h-6 text-gold" /> Book Discussion
        </h2>
        <p className="text-ink-muted mb-4 text-sm">Join the open discussion for this book! Share your thoughts, ask questions, and connect with other readers below.</p>
        {/* Comment input */}
        {user ? (
          <div className="mb-4">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold resize-none"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
              disabled={commentLoading}
            />
            <div className="flex justify-end mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePostComment}
                disabled={!commentText.trim() || commentLoading}
                className="px-5 py-2 rounded-xl text-sm font-medium text-parchment flex items-center gap-2 disabled:opacity-50 bg-forest"
              >
                {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4" /> Post</>}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center text-ink-muted text-sm">
            <Link href="/login" className="text-gold hover:text-gold-dark font-semibold">Sign in</Link> to join the discussion.
          </div>
        )}
        {/* Comments list */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-ink-muted py-6">No comments yet. Be the first to start the discussion!</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3 items-start p-3 rounded-xl bg-cream/40 border border-gold-light/20">
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt={comment.author.reader_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gold to-amber text-parchment">
                    {comment.author.reader_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{comment.author.reader_name}</span>
                    <span className="text-xs text-ink-muted">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-ink-light mt-1 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* Book Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-6 mb-8"
      >
        {/* Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="book-cover-glow w-40 h-60 rounded-2xl bg-gradient-to-br from-bark to-espresso overflow-hidden shadow-2xl"
          >
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="text-center">
                  <BookOpen className="w-10 h-10 text-gold-light/30 mx-auto mb-2" />
                  <p className="text-gold-light/50 text-xs">{book.title}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Author *</label>
                  <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Total Pages</label>
                    <input
                      type="number"
                      value={editForm.totalPages}
                      onChange={(e) => setEditForm({ ...editForm, totalPages: e.target.value })}
                      className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Genre</label>
                    <select
                      value={editForm.genre}
                      onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                      className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                    >
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={editForm.coverUrl}
                    onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">ISBN</label>
                  <input
                    type="text"
                    value={editForm.isbn}
                    onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="classic, favorites, book-club"
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-xl text-sm text-ink resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEdit}
                    className="flex-1 py-2 bg-gradient-to-r from-gold to-amber text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Changes
                  </motion.button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm text-ink-muted hover:text-ink border border-gold-light/20 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="book-info" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {book.title}
                    </h1>
                    <p className="text-ink-muted text-lg mb-3">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={startEditing}
                      className="p-2 hover:bg-gold-light/10 rounded-full transition-colors"
                      title="Edit book"
                    >
                      <Edit3 className={`w-4 h-4 text-ink-muted hover:text-gold-dark`} />
                    </button>
                    <button
                      onClick={() => toggleFavorite(book.id)}
                      className="p-2 hover:bg-gold-light/10 rounded-full transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${book.favorite ? 'text-rose fill-rose' : 'text-ink-muted'}`} />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[book.status]}`}>
                    {statusLabels[book.status]}
                  </span>
                  {book.genre && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-lavender/10 text-plum border border-lavender/20">
                      {book.genre}
                    </span>
                  )}
                  {book.totalPages > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cream text-ink-muted border border-gold-light/20">
                      {book.totalPages} pages
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(i + 1)}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          i < (hoverRating || book.rating || rating)
                            ? 'text-gold fill-gold'
                            : 'text-gold-light/30'
                        }`}
                      />
                    </motion.button>
                  ))}
                  {book.rating && <span className="text-xs text-ink-muted ml-2">{book.rating}/5</span>}
                </div>

                {/* Status change */}
                <div className="flex flex-wrap gap-2">
                  {(['want-to-read', 'reading', 'completed', 'dnf'] as ReadingStatus[]).map((status) => (
                    <motion.button
                      key={status}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(status)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                        ${book.status === status
                          ? 'bg-gold/10 border-gold/30 text-gold-dark'
                          : 'border-gold-light/20 text-ink-muted hover:border-gold-light/40'}
                      `}
                    >
                      {status === 'want-to-read' ? 'TBR' : status === 'reading' ? 'Reading' : status === 'completed' ? 'Completed' : 'DNF'}
                    </motion.button>
                  ))}
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Added {format(new Date(book.dateAdded), 'MMM d, yyyy')}
                  </span>
                  {book.startDate && (
                    <span className="flex items-center gap-1">
                      <BookMarked className="w-3.5 h-3.5" />
                      Started {format(new Date(book.startDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {book.finishDate && (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Finished {format(new Date(book.finishDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative divider */}
      <div className="mb-4 -mt-2">
        <LotusDivider className="h-12 opacity-70" />
      </div>

      {/* Progress Section */}
      {book.totalPages > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 mb-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Reading Progress
            </h2>
          </div>

          {/* Lotus Progress bar */}
          <LotusProgressBar progress={progress} size="lg" showPercentage className="mb-4" />

          <div className="flex items-center justify-between text-sm text-ink-muted mb-4">
            <span>Page {book.currentPage} of {book.totalPages}</span>
            <span>{pagesLeft} pages remaining</span>
          </div>

          {/* Quick progress update */}
          <div className="flex items-center gap-3">
            {editingProgress ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  placeholder={String(book.currentPage)}
                  min={0}
                  max={book.totalPages}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateProgress()}
                  className="flex-1 px-3 py-2 bg-cream/50 border border-gold-light/30 rounded-lg text-sm"
                  autoFocus
                />
                <button onClick={handleUpdateProgress} className="p-2 bg-forest/10 rounded-lg text-forest hover:bg-forest/20 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingProgress(false)} className="p-2 bg-rose/10 rounded-lg text-rose hover:bg-rose/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuickProgress(-10)}
                  className="p-2 bg-cream rounded-lg text-ink-muted hover:bg-gold-light/20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuickProgress(10)}
                  className="p-2 bg-cream rounded-lg text-ink-muted hover:bg-gold-light/20 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.button>
                <span className="text-xs text-ink-muted">±10 pages</span>
                <button
                  onClick={() => { setEditingProgress(true); setProgressInput(String(book.currentPage)); }}
                  className="ml-auto text-xs text-gold-dark hover:text-gold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Set page
                </button>
                {book.status === 'reading' && (
                  <button
                    onClick={() => handleProgressWithConfetti(book.id, book.totalPages)}
                    className="text-xs text-forest hover:text-forest-light flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Mark done
                  </button>
                )}
              </>
            )}
          </div>
        </motion.section>
      )}

      {/* Block print border */}
      <div className="mb-4">
        <BlockPrintBorder className="h-6 opacity-50" />
      </div>

      {/* Reading Sessions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Reading Sessions
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSessionForm(!showSessionForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gold to-amber text-white rounded-lg text-xs font-medium shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Log Session
          </motion.button>
        </div>

        {/* Session stats */}
        {book.sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-cream/50 rounded-lg">
              <p className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{book.sessions.length}</p>
              <p className="text-[10px] text-ink-muted">Sessions</p>
            </div>
            <div className="text-center p-2 bg-cream/50 rounded-lg">
              <p className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{Math.round(totalSessionMinutes / 60)}h {totalSessionMinutes % 60}m</p>
              <p className="text-[10px] text-ink-muted">Total Time</p>
            </div>
            <div className="text-center p-2 bg-cream/50 rounded-lg">
              <p className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{avgPagesPerSession}</p>
              <p className="text-[10px] text-ink-muted">Avg Pages/Session</p>
            </div>
          </div>
        )}

        {/* Add session form */}
        <AnimatePresence>
          {showSessionForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-cream/30 rounded-xl mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Pages read *</label>
                    <input
                      type="number"
                      value={sessionPages}
                      onChange={(e) => setSessionPages(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-white border border-gold-light/30 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Minutes spent</label>
                    <input
                      type="number"
                      value={sessionMinutes}
                      onChange={(e) => setSessionMinutes(e.target.value)}
                      placeholder="45"
                      className="w-full px-3 py-2 bg-white border border-gold-light/30 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Great chapter about..."
                    className="w-full px-3 py-2 bg-white border border-gold-light/30 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddSession}
                    className="flex-1 py-2 bg-gradient-to-r from-forest to-sage text-white rounded-lg text-sm font-medium"
                  >
                    Save Session
                  </motion.button>
                  <button
                    onClick={() => setShowSessionForm(false)}
                    className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        {book.sessions.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...book.sessions].reverse().map((session) => (
              <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/50 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-gold-light/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gold-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">
                    {session.pagesRead} pages · {session.minutesSpent}min
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                    {session.notes && ` · ${session.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteSession(book.id, session.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-rose/40 hover:text-rose transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-ink-muted py-4">No reading sessions yet. Log your first one!</p>
        )}
      </motion.section>

      {/* Notes & Review */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-semibold text-ink mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Notes & Review
        </h2>

        {book.notes && (
          <div className="mb-4">
            <p className="text-xs text-ink-muted mb-1">Notes</p>
            <p className="text-sm text-ink-light leading-relaxed">{book.notes}</p>
          </div>
        )}

        {showReviewForm ? (
          <div className="space-y-3">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review..."
              rows={4}
              className="w-full px-4 py-3 bg-cream/50 border border-gold-light/30 rounded-xl text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveReview}
                className="px-4 py-2 bg-gradient-to-r from-gold to-amber text-white rounded-lg text-sm font-medium"
              >
                Save Review
              </motion.button>
              <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-sm text-ink-muted">
                Cancel
              </button>
            </div>
          </div>
        ) : book.review ? (
          <div>
            <p className="text-xs text-ink-muted mb-1">Review</p>
            <p className="text-sm text-ink-light leading-relaxed italic">{book.review}</p>
            <button
              onClick={() => { setReviewText(book.review || ''); setShowReviewForm(true); }}
              className="text-xs text-gold-dark mt-2 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit review
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowReviewForm(true)}
            className="text-sm text-gold-dark hover:text-gold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Write a review
          </button>
        )}
      </motion.section>

      {/* Tags */}
      {book.tags.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {book.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs bg-sage-light/20 text-forest border border-sage/20">
                #{tag}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Related Reads — books sharing genre or tags */}
      {(() => {
        const related = books
          .filter(b => b.id !== book.id)
          .map(b => {
            let score = 0;
            if (b.genre && b.genre === book.genre) score += 2;
            const sharedTags = b.tags.filter(t => book.tags.includes(t));
            score += sharedTags.length;
            return { book: b, score, sharedTags };
          })
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);

        if (related.length === 0) return null;

        return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" className="text-gold">
                <path d="M1 9 C5 4, 13 4, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M1 9 C5 14, 13 14, 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
              </svg>
              Threads
            </h2>
            <div className="space-y-2">
              {related.map((r, i) => (
                <Link key={r.book.id} href={`/book/${r.book.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-colors group"
                  >
                    {/* Thread line connector */}
                    <div className="absolute -left-1 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-light/40 to-transparent" />
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-gold-light/50 bg-parchment" />

                    <div className="book-cover-glow w-10 h-14 rounded-lg bg-gradient-to-br from-bark to-espresso overflow-hidden flex-shrink-0 shadow-sm">
                      {r.book.coverUrl ? (
                        <img src={r.book.coverUrl} alt={r.book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-gold-light/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate group-hover:text-gold-dark transition-colors">{r.book.title}</p>
                      <p className="text-xs text-ink-muted truncate">{r.book.author}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.book.genre === book.genre && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold-dark">{r.book.genre}</span>
                        )}
                        {r.sharedTags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage-light/20 text-forest">#{t}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-muted/30 -rotate-90 group-hover:text-gold-dark transition-colors" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        );
      })()}

      {/* Danger zone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4 border-t border-gold-light/20"
      >
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3 p-3 bg-rose/5 rounded-xl border border-rose/20">
            <p className="text-sm text-rose flex-1">Are you sure you want to delete this book?</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="px-4 py-1.5 bg-rose text-white rounded-lg text-xs font-medium"
            >
              Delete
            </motion.button>
            <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-ink-muted">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-ink-muted/50 hover:text-rose transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete book
          </button>
        )}
      </motion.section>
    </div>
  );
}
