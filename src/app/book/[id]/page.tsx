"use client";
import React from 'react';
import { useBookStore } from '@/lib/store';
import { LotusProgressBar } from '@/components/IndianPatterns';
import Confetti from '@/components/Confetti';
import type { Book, Thread, ReadingStatus } from '@/lib/types';
import { useState, useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

export default function BookPage() {
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<(Book & { threads?: Thread[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    status: '' as ReadingStatus,
    currentPage: 0,
    rating: 0,
    notes: '',
  });
  // Book details editing
  const [showDetailsEdit, setShowDetailsEdit] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    title: '',
    author: '',
    genre: '',
    coverUrl: '',
    totalPages: 0,
  });
  // Add missing state for session modal and form
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    pagesRead: 0,
    minutesSpent: 0,
    notes: '',
  });
  // Add missing state for delete confirmation and deleted message
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletedMsg, setShowDeletedMsg] = useState(false);
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Helper to update book in Supabase and local state
  const updateBookInSupabase = async (updatedBook: Book) => {
    // Also sync to Zustand store
    useBookStore.getState().updateBook(updatedBook.id, updatedBook);
    // Then persist to Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('reading_data')
      .eq('id', user.id)
      .single();
    if (!profile) return;
    const books = (profile.reading_data.books || []).map((b: Book) =>
      b.id === updatedBook.id ? updatedBook : b
    );
    await supabase
      .from('profiles')
      .update({ reading_data: { ...profile.reading_data, books } })
      .eq('id', user.id);
    setBook(updatedBook);
  };

  // Fetch book data — check local Zustand store first, then Supabase
  useEffect(() => {
    const fetchBook = async () => {
      // Check local Zustand store first
      const storeBooks = useBookStore.getState().books;
      const localBook = storeBooks.find((b: Book) => b.id === id);
      if (localBook) {
        setBook(localBook);
        setForm({
          status: localBook.status,
          currentPage: localBook.currentPage || 0,
          rating: localBook.rating || 0,
          notes: localBook.notes || '',
        });
        setDetailsForm({
          title: localBook.title || '',
          author: localBook.author || '',
          genre: localBook.genre || '',
          coverUrl: localBook.coverUrl || '',
          totalPages: localBook.totalPages || 0,
        });
        setLoading(false);
        return;
      }

      // Fallback to Supabase
      if (!isSupabaseConfigured()) {
        setError('Book not found in your library.');
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('reading_data')
        .eq('id', user.id)
        .single();
      if (!profile) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }
      const books: Book[] = profile.reading_data?.books || [];
      const found = books.find((b: Book) => b.id === id);
      if (!found) {
        setError('Book not found in your library.');
        setLoading(false);
        return;
      }
      setBook(found);
      setForm({
        status: found.status,
        currentPage: found.currentPage || 0,
        rating: found.rating || 0,
        notes: found.notes || '',
      });
      setDetailsForm({
        title: found.title || '',
        author: found.author || '',
        genre: found.genre || '',
        coverUrl: found.coverUrl || '',
        totalPages: found.totalPages || 0,
      });
      setLoading(false);
    };
    fetchBook();
  }, [id]);

  const handleDetailsSave = async () => {
    if (!book || savingDetails) return;
    setSavingDetails(true);
    try {
      const updatedBook = {
        ...book,
        title: detailsForm.title.trim() || book.title,
        author: detailsForm.author.trim() || book.author,
        genre: detailsForm.genre.trim(),
        coverUrl: detailsForm.coverUrl.trim() || book.coverUrl,
        totalPages: detailsForm.totalPages || book.totalPages,
      };
      await updateBookInSupabase(updatedBook);
      setShowDetailsEdit(false);
    } finally {
      setSavingDetails(false);
    }
  };

  useEffect(() => {
    if (form.status === 'completed' && book && book.status !== 'completed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [form.status, book]);

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'rating' || name === 'currentPage' ? Number(value) : value }));
  };

  const handleEditSave = async () => {
    if (!book) return;
    let updatedBook = { ...book, ...form };
    // Set startDate if status is reading
    if (form.status === 'reading' && !book.startDate) {
      updatedBook.startDate = new Date().toISOString();
    }
    // Set finishDate if status is completed
    if (form.status === 'completed' && !book.finishDate) {
      updatedBook.finishDate = new Date().toISOString();
    }
    await updateBookInSupabase(updatedBook);
    setShowEdit(false);
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    // Remove from Zustand store (local)
    useBookStore.getState().deleteBook(book.id);
    // Remove from Supabase (cloud)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('reading_data')
          .eq('id', user.id)
          .single();
        if (profile) {
          const books = (profile.reading_data?.books || []).filter((b: Book) => b.id !== book.id);
          await supabase
            .from('profiles')
            .update({ reading_data: { ...profile.reading_data, books } })
            .eq('id', user.id);
        }
      }
    } catch (err) {
      console.error('Error deleting from cloud:', err);
    }
    setBook(null);
    setShowDeleteConfirm(false);
    setShowDeletedMsg(true);
    setTimeout(() => {
      router.push('/library');
    }, 1500);
  };

  const handleLogSession = async () => {
    if (!book) return;
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pagesRead: sessionForm.pagesRead,
      minutesSpent: sessionForm.minutesSpent,
      notes: sessionForm.notes,
    };
    let updatedBook = { ...book, sessions: [...(book.sessions || []), newSession] };
    // Advance progress bar by pages read in this session
    const newPage = Math.min(book.totalPages, (book.currentPage || 0) + sessionForm.pagesRead);
    updatedBook.currentPage = newPage;
    // Set startDate if first session
    if (!book.startDate && sessionForm.pagesRead > 0) {
      updatedBook.startDate = new Date().toISOString();
      updatedBook.status = 'reading';
    }
    // Auto-complete if reached total pages
    if (newPage >= book.totalPages && book.status === 'reading') {
      updatedBook.status = 'completed';
      updatedBook.finishDate = new Date().toISOString();
      updatedBook.currentPage = book.totalPages;
    }
    await updateBookInSupabase(updatedBook);
    setBook(updatedBook);
    // Sync form state too
    setForm(f => ({ ...f, currentPage: updatedBook.currentPage, status: updatedBook.status }));
    // Also update Zustand store — addSession already calls logDaily
    const store = useBookStore.getState();
    store.updateBook(book.id, {
      currentPage: updatedBook.currentPage,
      status: updatedBook.status,
      sessions: updatedBook.sessions,
      startDate: updatedBook.startDate,
      finishDate: updatedBook.finishDate,
    });
    // Log daily activity for goals/analytics tracking
    const dateKey = new Date().toISOString().split('T')[0];
    store.logDaily(dateKey, sessionForm.pagesRead, sessionForm.minutesSpent, book.id);
    setShowSessionModal(false);
    setSessionForm({ pagesRead: 0, minutesSpent: 0, notes: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }
  if (error || !book) {
    return <div className="min-h-screen flex items-center justify-center text-rose-700">{error || 'Book not found.'}</div>;
  }

  // Calculate progress
  const progress = book.totalPages > 0 ? Math.round((form.currentPage / book.totalPages) * 100) : 0;
  const pagesRemaining = book.totalPages > 0 ? book.totalPages - form.currentPage : 0;

  // Status badge colors
  const statusColors: Record<string, string> = {
    'want-to-read': 'bg-teal/10 text-teal border-teal/20',
    'reading': 'bg-amber/10 text-amber border-amber/20',
    'completed': 'bg-forest/10 text-forest border-forest/20',
    'dnf': 'bg-rose/10 text-rose border-rose/20',
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {showConfetti && <Confetti show={showConfetti} />}
      {book && (
        <>
          {/* Book Header Card */}
          <div className="glass-card rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--th-card-shadow)' }}>
            <div className="flex items-start gap-5">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-32 h-48 object-cover rounded-xl shadow-md flex-shrink-0" />
              ) : (
                <div className="w-32 h-48 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--th-gold-light), var(--th-amber))' }}>
                  <span className="text-parchment text-3xl font-bold">{book.title.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-ink leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{book.title}</h1>
                    <p className="text-sm text-ink-muted mb-3" style={{ fontFamily: "'Lora', Georgia, serif" }}>{book.author || 'Unknown Author'}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsEdit(true)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gold-dark border border-gold-light/30 hover:bg-gold-light/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                </div>

                {/* Status + Genre + Pages pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                    style={{
                      background: `color-mix(in srgb, ${form.status === 'completed' ? 'var(--th-forest)' : form.status === 'reading' ? 'var(--th-gold)' : form.status === 'dnf' ? 'var(--th-rose)' : 'var(--th-teal)'} 12%, transparent)`,
                      color: form.status === 'completed' ? 'var(--th-forest)' : form.status === 'reading' ? 'var(--th-gold-dark)' : form.status === 'dnf' ? 'var(--th-rose)' : 'var(--th-teal)',
                      borderColor: `color-mix(in srgb, ${form.status === 'completed' ? 'var(--th-forest)' : form.status === 'reading' ? 'var(--th-gold)' : form.status === 'dnf' ? 'var(--th-rose)' : 'var(--th-teal)'} 25%, transparent)`,
                    }}
                  >
                    {form.status === 'want-to-read' ? 'Want to Read' : form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </span>
                  {book.genre && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/8 text-gold-dark border border-gold/15">{book.genre}</span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream text-ink-muted border border-gold-light/20">{book.totalPages} pages</span>
                </div>

                {/* Star Rating */}
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      className="transition-all hover:scale-110"
                      onClick={async () => {
                        setForm(f => ({ ...f, rating: star }));
                        if (book) {
                          const updated = { ...book, rating: star };
                          await updateBookInSupabase(updated);
                        }
                      }}
                      style={{ color: star <= (form.rating || 0) ? 'var(--th-gold)' : 'var(--th-gold-light)', fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={`Set rating to ${star}`}
                    >★</button>
                  ))}
                  {form.rating > 0 && <span className="text-xs text-ink-muted ml-1 self-center">{form.rating}/5</span>}
                </div>

                {/* Dates */}
                <div className="text-[11px] text-ink-muted flex flex-wrap gap-x-3 gap-y-0.5">
                  {book.dateAdded && <span>Added {new Date(book.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  {book.startDate && <span>Started {new Date(book.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  {book.finishDate && <span>Finished {new Date(book.finishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
              </div>
            </div>

            {/* Status selector */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gold-light/20">
              {(['want-to-read', 'reading', 'completed', 'dnf'] as const).map(status => {
                const isActive = form.status === status;
                const colors: Record<string, { bg: string; text: string; border: string }> = {
                  'want-to-read': { bg: 'var(--th-teal)', text: 'var(--th-parchment)', border: 'var(--th-teal)' },
                  'reading': { bg: 'var(--th-gold)', text: 'var(--th-parchment)', border: 'var(--th-gold)' },
                  'completed': { bg: 'var(--th-forest)', text: 'var(--th-parchment)', border: 'var(--th-forest)' },
                  'dnf': { bg: 'var(--th-rose)', text: 'var(--th-parchment)', border: 'var(--th-rose)' },
                };
                return (
                  <button
                    key={status}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={isActive
                      ? { background: colors[status].bg, color: colors[status].text, borderWidth: '1px', borderColor: colors[status].border }
                      : { background: 'transparent', color: 'var(--th-ink-muted)', borderWidth: '1px', borderColor: 'var(--th-glass-border)' }
                    }
                    onClick={async () => {
                      setForm(f => ({ ...f, status: status as ReadingStatus }));
                      if (!book) return;
                      let updatedBook = { ...book, status: status as ReadingStatus };
                      if (status === 'reading' && !book.startDate) updatedBook.startDate = new Date().toISOString();
                      if (status === 'completed' && !book.finishDate) updatedBook.finishDate = new Date().toISOString();
                      await updateBookInSupabase(updatedBook);
                      setBook(updatedBook);
                    }}
                  >
                    {status === 'want-to-read' ? 'TBR' : status === 'dnf' ? 'DNF' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Progress Card */}
          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Reading Progress</h2>
              <span className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{progress}%</span>
            </div>
            <LotusProgressBar progress={progress} showPercentage={false} />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-ink-muted">Page {form.currentPage} of {book.totalPages}</span>
              <span className="text-xs text-ink-muted">{pagesRemaining} remaining</span>
            </div>

            {/* Page controls */}
            <div className="mt-3 pt-3 border-t border-gold-light/20 space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium border border-gold-light/30 text-ink-muted hover:bg-cream/60 active:bg-cream/80 transition-colors touch-manipulation"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.max(0, f.currentPage - 10) }))}
                >−10</button>
                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium border border-gold-light/30 text-ink-muted hover:bg-cream/60 active:bg-cream/80 transition-colors touch-manipulation"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.max(0, f.currentPage - 1) }))}
                >−1</button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.currentPage}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    const val = raw === '' ? 0 : Math.max(0, Math.min(book.totalPages, Number(raw)));
                    setForm(f => ({ ...f, currentPage: val }));
                  }}
                  className="flex-1 text-center px-2 min-h-[44px] rounded-lg bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                />
                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium border border-gold-light/30 text-ink-muted hover:bg-cream/60 active:bg-cream/80 transition-colors touch-manipulation"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.min(book.totalPages, f.currentPage + 1) }))}
                >+1</button>
                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium border border-gold-light/30 text-ink-muted hover:bg-cream/60 active:bg-cream/80 transition-colors touch-manipulation"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.min(book.totalPages, f.currentPage + 10) }))}
                >+10</button>
              </div>
              <button
                className="w-full min-h-[44px] rounded-lg text-sm font-medium text-parchment disabled:opacity-50 touch-manipulation"
                style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                disabled={savingProgress}
                onClick={async () => {
                  if (!book || savingProgress) return;
                  setSavingProgress(true);
                  try {
                    const updated = { ...book, currentPage: form.currentPage };
                    await updateBookInSupabase(updated);
                    setSaveSuccess('progress');
                    setTimeout(() => setSaveSuccess(null), 1500);
                  } finally {
                    setSavingProgress(false);
                  }
                }}
              >{savingProgress ? 'Saving...' : saveSuccess === 'progress' ? '✓ Saved!' : 'Save Progress'}</button>
            </div>
          </div>

          {/* Reading Sessions Card */}
          <div className="glass-card rounded-2xl p-5 mb-6 border border-gold-light/15">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gold-dark"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Reading Sessions
              </h2>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-parchment shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                onClick={() => setShowSessionModal(true)}
              >
                + Log Session
              </button>
            </div>

            {/* Session stats summary */}
            {(book.sessions || []).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-gold/5 border border-gold-light/15">
                <div className="text-center">
                  <div className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {(book.sessions || []).length}
                  </div>
                  <p className="text-[10px] text-ink-muted">sessions</p>
                </div>
                <div className="text-center border-x border-gold-light/15">
                  <div className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {(book.sessions || []).reduce((s, sess) => s + sess.pagesRead, 0)}
                  </div>
                  <p className="text-[10px] text-ink-muted">pages logged</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {(() => { const m = (book.sessions || []).reduce((s, sess) => s + sess.minutesSpent, 0); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`; })()}
                  </div>
                  <p className="text-[10px] text-ink-muted">time spent</p>
                </div>
              </div>
            )}

            {(book.sessions || []).length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gold"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">No sessions yet</p>
                  <p className="text-xs text-ink-muted mt-1">Track your reading by logging how many pages you read and how long you spent. Your progress is tracked automatically!</p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-parchment shadow-md"
                  style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                  onClick={() => setShowSessionModal(true)}
                >
                  Log Your First Session
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(book.sessions || []).map(session => {
                  const getRelativeTime = (dateStr: string) => {
                    const now = new Date();
                    const date = new Date(dateStr);
                    const diffMs = now.getTime() - date.getTime();
                    const diffMin = Math.floor(diffMs / 60000);
                    if (diffMin < 1) return 'just now';
                    if (diffMin < 60) return `${diffMin}m ago`;
                    const diffHr = Math.floor(diffMin / 60);
                    if (diffHr < 24) return `${diffHr}h ago`;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  };
                  return (
                    <div key={session.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cream/40 border border-gold-light/15">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--th-forest)', opacity: 0.15 }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--th-forest)' }}>{session.pagesRead}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-ink">{session.pagesRead} pages</span>
                          <span className="text-ink-muted">·</span>
                          <span className="text-ink-muted">{session.minutesSpent} min</span>
                        </div>
                        {session.notes && <p className="text-[11px] text-ink-muted mt-0.5 truncate italic">{session.notes}</p>}
                      </div>
                      <span className="text-[10px] text-ink-muted flex-shrink-0">{getRelativeTime(session.date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Log Session Modal */}
          {showSessionModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowSessionModal(false)}>
              <div className="bg-parchment rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm max-h-[85vh] overflow-y-auto border border-gold-light/30 touch-manipulation" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Log Reading Session</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Pages read</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={sessionForm.pagesRead || ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setSessionForm(f => ({ ...f, pagesRead: raw === '' ? 0 : Number(raw) }));
                      }}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Minutes spent</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={sessionForm.minutesSpent || ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setSessionForm(f => ({ ...f, minutesSpent: raw === '' ? 0 : Number(raw) }));
                      }}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Notes (optional)</label>
                    <textarea
                      value={sessionForm.notes}
                      onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none touch-manipulation"
                      rows={2}
                      placeholder="Great chapter about..."
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowSessionModal(false)}
                      className="flex-1 px-4 min-h-[44px] rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 active:bg-cream/60 transition-colors touch-manipulation"
                    >Cancel</button>
                    <button
                      onClick={handleLogSession}
                      disabled={!sessionForm.pagesRead || savingSession}
                      className="flex-1 px-4 min-h-[44px] rounded-xl text-sm font-medium text-parchment disabled:opacity-50 touch-manipulation"
                      style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                    >{savingSession ? 'Saving...' : 'Save Session'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEdit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowEdit(false)}>
              <div className="bg-parchment rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm max-h-[85vh] overflow-y-auto border border-gold-light/30 touch-manipulation" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Edit Book Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Status</label>
                    <select name="status" value={form.status} onChange={handleEditChange} className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation">
                      <option value="want-to-read">Want to Read</option>
                      <option value="reading">Reading</option>
                      <option value="completed">Completed</option>
                      <option value="dnf">DNF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Current Page</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" name="currentPage" value={form.currentPage} onChange={handleEditChange} className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => setForm(f => ({ ...f, rating: star }))}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                          style={{ color: star <= form.rating ? 'var(--th-gold)' : 'var(--th-gold-light)', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >★</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Notes / Review</label>
                    <textarea name="notes" value={form.notes} onChange={handleEditChange} className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none touch-manipulation" rows={3} placeholder="Your thoughts..." />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowEdit(false)} className="flex-1 px-4 min-h-[44px] rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 active:bg-cream/60 transition-colors touch-manipulation">Cancel</button>
                    <button onClick={handleEditSave} className="flex-1 px-4 min-h-[44px] rounded-xl text-sm font-medium text-parchment touch-manipulation" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes & Review */}
          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Notes & Review</h2>
              <button className="text-xs text-gold-dark hover:text-gold transition-colors flex items-center gap-1" onClick={() => setShowEdit(true)}>
                Edit
              </button>
            </div>
            <div className="rounded-xl bg-cream/40 border border-gold-light/15 p-4 min-h-[60px]">
              <p className="text-sm text-ink italic" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {form.notes || 'No notes yet. Tap edit to add your thoughts.'}
              </p>
            </div>
          </div>

          {/* Threads */}
          {book.threads && book.threads.length > 0 && (
            <div className="glass-card rounded-2xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-3">Threads</h2>
              <div className="space-y-2">
                {book.threads.map((thread: Thread) => (
                  <div key={thread.id} className="flex items-center gap-3 p-2 rounded-xl bg-cream/40 border border-gold-light/15">
                    {thread.coverUrl && (
                      <img src={thread.coverUrl} alt={thread.name} className="w-10 h-10 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{thread.name}</div>
                      <div className="text-[11px] text-ink-muted">{thread.author}</div>
                    </div>
                    {thread.genre && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/10 text-gold-dark border border-gold/15">{thread.genre}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Book Details Modal (title, author, genre, cover, pages) */}
          {showDetailsEdit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowDetailsEdit(false)}>
              <div className="bg-parchment rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm max-h-[85vh] overflow-y-auto border border-gold-light/30 touch-manipulation" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Edit Book Info</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Title</label>
                    <input
                      type="text"
                      value={detailsForm.title}
                      onChange={e => setDetailsForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="Book title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Author</label>
                    <input
                      type="text"
                      value={detailsForm.author}
                      onChange={e => setDetailsForm(f => ({ ...f, author: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Genre</label>
                    <input
                      type="text"
                      value={detailsForm.genre}
                      onChange={e => setDetailsForm(f => ({ ...f, genre: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="e.g. Fiction, Romance, Sci-Fi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Cover Image URL</label>
                    <input
                      type="url"
                      value={detailsForm.coverUrl}
                      onChange={e => setDetailsForm(f => ({ ...f, coverUrl: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="https://..."
                    />
                    {detailsForm.coverUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={detailsForm.coverUrl} alt="Preview" className="w-10 h-14 object-cover rounded-md border border-gold-light/20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-[10px] text-ink-muted">Preview</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1 uppercase tracking-wider">Total Pages</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={detailsForm.totalPages || ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setDetailsForm(f => ({ ...f, totalPages: raw === '' ? 0 : Number(raw) }));
                      }}
                      className="w-full px-3 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm touch-manipulation"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowDetailsEdit(false)} className="flex-1 px-4 min-h-[44px] rounded-xl text-sm text-ink-muted border border-gold-light/30 hover:bg-cream/40 active:bg-cream/60 transition-colors touch-manipulation">Cancel</button>
                    <button onClick={handleDetailsSave} disabled={savingDetails} className="flex-1 px-4 min-h-[44px] rounded-xl text-sm font-medium text-parchment disabled:opacity-50 touch-manipulation" style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}>{savingDetails ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Book */}
          <div className="mb-6">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose/10 text-rose border border-rose/20 text-xs font-semibold hover:bg-rose/20 transition-all"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Delete Book
            </button>

            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-parchment rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border border-rose/20">
                  <div className="w-14 h-14 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Delete this book?</h3>
                  <p className="text-sm text-ink-muted mb-1">
                    <strong className="text-ink">{book.title}</strong> by {book.author}
                  </p>
                  <p className="text-xs text-rose/80 mb-6 bg-rose/5 rounded-lg p-2 border border-rose/10">
                    ⚠️ This action cannot be undone. All reading sessions, notes, and progress will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                      onClick={() => setShowDeleteConfirm(false)}
                    >Keep Book</button>
                    <button
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose text-white hover:bg-rose/90 transition-colors"
                      onClick={handleDeleteBook}
                    >Delete Forever</button>
                  </div>
                </div>
              </div>
            )}

            {showDeletedMsg && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-parchment rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border border-gold-light/30">
                  <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 className="text-xl font-bold text-ink mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Book Deleted</h3>
                  <p className="text-sm text-ink-muted">Redirecting to your library...</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
