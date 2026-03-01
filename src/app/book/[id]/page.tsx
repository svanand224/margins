"use client";
import React from 'react';
import { useBookStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import { LotusProgressBar, MehndiDivider } from '@/components/IndianPatterns';
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

  // Helper to update book in Supabase and local state
  const updateBookInSupabase = async (updatedBook: Book) => {
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

  // Fetch book data from Supabase
  useEffect(() => {
    const fetchBook = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured.');
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
        setError('Book not found.');
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
      setLoading(false);
    };
    fetchBook();
  }, [id]);

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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('reading_data')
      .eq('id', user.id)
      .single();
    if (!profile) return;
    const books = profile.reading_data.books.filter((b: Book) => b.id !== book.id);
    await supabase
      .from('profiles')
      .update({ reading_data: { ...profile.reading_data, books } })
      .eq('id', user.id);
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
    // Set startDate if first session
    if (!book.startDate && sessionForm.pagesRead > 0) {
      updatedBook.startDate = new Date().toISOString();
    }
    await updateBookInSupabase(updatedBook);
    setBook(updatedBook);
    setShowSessionModal(false);
    setSessionForm({ pagesRead: 0, minutesSpent: 0, notes: '' });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
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
          <div className="flex items-start gap-6">
            {book.coverUrl && (
              <img src={book.coverUrl} alt={book.title} className="w-40 h-60 object-cover rounded-lg mb-4" />
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{book.title}</h1>
              <p className="text-lg text-ink-muted mb-2" style={{ fontFamily: "'Lora', serif" }}>{book.author || 'Unknown Author'}</p>
              <div className="flex gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-rose/10 to-copper/10 text-rose-dark border border-rose/20 text-xs font-semibold mr-2 shadow-sm" style={{ minWidth: 80 }}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal/10 to-forest/10 text-teal-dark border border-teal/20 text-xs font-semibold mr-2 shadow-sm" style={{ minWidth: 80 }}>{book.genre}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-gold/10 to-amber/10 text-gold-dark border border-gold/20 text-xs font-semibold mr-2 shadow-sm" style={{ minWidth: 80 }}>{book.totalPages} pages</span>
              </div>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    className={star <= (form.rating || 0) ? 'text-gold fill-gold' : 'text-gold-light/30'}
                    onClick={() => setForm(f => ({ ...f, rating: star }))}
                    style={{ fontSize: '1.2em', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label={`Set rating to ${star}`}
                  >★</button>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                {['want-to-read', 'reading', 'completed', 'dnf'].map(status => (
                  <button
                    key={status}
                    className={`px-2 py-1 rounded border font-semibold text-xs transition-colors duration-150 shadow-sm ${statusColors[status]} ${form.status === status ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400' : 'hover:bg-rose-100 hover:border-rose-200 dark:hover:bg-ink-muted dark:hover:border-rose-400'}`}
                    onClick={async () => {
                      setForm(f => ({ ...f, status: status as ReadingStatus }));
                      if (!book) return;
                      let updatedBook = { ...book, status: status as ReadingStatus };
                      if (status === 'reading' && !book.startDate) {
                        updatedBook.startDate = new Date().toISOString();
                      }
                      if (status === 'completed' && !book.finishDate) {
                        updatedBook.finishDate = new Date().toISOString();
                      }
                      await updateBookInSupabase(updatedBook);
                      setBook(updatedBook);
                    }}
                    style={{ fontFamily: 'inherit', minWidth: 48 }}
                  >
                    {status === 'want-to-read' ? 'TBR' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mb-2 text-xs text-ink-muted flex flex-wrap gap-2 items-center">
                <span>Added {book.dateAdded ? new Date(book.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                {book.startDate && <span>Started {new Date(book.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                {book.finishDate && <span>Completed {new Date(book.finishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <MehndiDivider className="mb-4 opacity-40" />
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink-muted flex items-center gap-2">Page {form.currentPage} of {book.totalPages}
                <button
                  className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose/10 to-copper/10 text-rose-dark text-xs font-semibold shadow hover:scale-105 transition-transform border border-rose/20"
                  onClick={() => setShowEdit(true)}
                  style={{ fontFamily: 'inherit' }}
                >
                  Set page
                </button>
                <button
                  className="ml-2 px-2 py-0.5 rounded-full bg-cream text-ink-muted border border-gold/20 text-xs font-semibold shadow hover:bg-gold/10 transition-transform"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.max(0, Math.min(book.totalPages, f.currentPage + 10)) }))}
                >+10</button>
                <button
                  className="ml-1 px-2 py-0.5 rounded-full bg-cream text-ink-muted border border-gold/20 text-xs font-semibold shadow hover:bg-gold/10 transition-transform"
                  onClick={() => setForm(f => ({ ...f, currentPage: Math.max(0, f.currentPage - 10) }))}
                >-10</button>
              </span>
              <span className="text-sm text-ink font-bold">{progress}%</span>
            </div>
            <div className="mb-1 text-xs text-ink font-semibold">Reading Progress</div>
            <LotusProgressBar progress={progress} showPercentage />
            <div className="mt-1 text-xs text-ink-muted">{pagesRemaining} pages remaining</div>
          </div>
          {showEdit && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Book Details</h2>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleEditChange} className="w-full p-2 border rounded">
                    <option value="want-to-read">TBR</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                    <option value="dnf">DNF</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Current Page</label>
                  <input type="number" name="currentPage" value={form.currentPage} onChange={handleEditChange} className="w-full p-2 border rounded" min={0} max={book.totalPages} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Rating</label>
                  <input type="number" name="rating" value={form.rating} onChange={handleEditChange} className="w-full p-2 border rounded" min={0} max={5} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleEditChange} className="w-full p-2 border rounded" rows={3} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-3 py-1 rounded bg-gray-200 text-gray-700" onClick={() => setShowEdit(false)}>Cancel</button>
                  <button className="px-3 py-1 rounded bg-rose-600 text-white font-semibold" onClick={handleEditSave}>Save</button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-6">
            <div className="mb-2 text-xs text-ink font-semibold">Reading Sessions</div>
            <div className="flex justify-end mb-3">
              <button
                className="px-4 py-1 rounded-full bg-gradient-to-r from-gold/10 to-amber/10 text-gold-dark border border-gold/20 text-xs font-semibold shadow hover:scale-105 transition-transform"
                onClick={() => setShowSessionModal(true)}
              >
                + Log Session
              </button>
            </div>
            {showSessionModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-ink rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-rose-700 dark:text-rose-200">Log Reading Session</h2>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Pages read <span className="text-rose-600">*</span></label>
                    <input type="number" min={1} max={book.totalPages} value={sessionForm.pagesRead} onChange={e => setSessionForm(f => ({ ...f, pagesRead: Number(e.target.value) }))} className="w-full p-2 border rounded dark:bg-ink-muted dark:text-ink" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Minutes spent</label>
                    <input type="number" min={1} value={sessionForm.minutesSpent} onChange={e => setSessionForm(f => ({ ...f, minutesSpent: Number(e.target.value) }))} className="w-full p-2 border rounded dark:bg-ink-muted dark:text-ink" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Notes (optional)</label>
                    <textarea value={sessionForm.notes} onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))} className="w-full p-2 border rounded dark:bg-ink-muted dark:text-ink" rows={2} placeholder="Great chapter about..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded bg-gray-200 dark:bg-ink-muted text-gray-700 dark:text-ink" onClick={() => setShowSessionModal(false)}>Cancel</button>
                    <button className="px-3 py-1 rounded bg-rose-600 text-white font-semibold" onClick={handleLogSession}>Save Session</button>
                  </div>
                </div>
              </div>
            )}
            {(book.sessions || []).length === 0 ? (
              <div className="text-ink-muted mb-2">No reading sessions yet. Log your first one!</div>
            ) : (
              <ul className="mb-2">
                {(book.sessions || []).map(session => {
                  const getRelativeTime = (dateStr: string) => {
                    const now = new Date();
                    const date = new Date(dateStr);
                    const diffMs = now.getTime() - date.getTime();
                    const diffMin = Math.floor(diffMs / 60000);
                    if (diffMin < 1) return 'less than a minute ago';
                    if (diffMin < 60) return `${diffMin} min ago`;
                    const diffHr = Math.floor(diffMin / 60);
                    if (diffHr < 24) return `${diffHr}h ${diffMin % 60}min ago`;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  };
                  return (
                    <li key={session.id} className="text-sm mb-2 flex items-center gap-3">
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded bg-cream/60 text-ink-muted text-xs font-medium shadow">
                        <span className="font-bold text-forest">{session.pagesRead} pages</span>
                        <span className="text-copper">·</span>
                        <span className="font-bold text-copper">{session.minutesSpent}min</span>
                        <span className="text-copper">·</span>
                        <span className="text-ink-muted">{getRelativeTime(session.date)}</span>
                        {session.notes && <span className="ml-2 italic text-ink-muted">{session.notes}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="mb-6">
            <div className="mb-2 text-xs text-ink font-semibold">Threads</div>
            <div className="rounded-xl border border-ink-muted/10 bg-cream/40 p-4">
              {book.threads && book.threads.length > 0 ? (
                <ul className="mb-2">
                  {book.threads.map((thread: Thread) => (
                    <li key={thread.id} className="flex items-center gap-3 mb-3">
                      {thread.coverUrl && (
                        <img src={thread.coverUrl} alt={thread.name} className="w-12 h-12 object-cover rounded-lg border border-ink-muted/20" />
                      )}
                      <div>
                        <div className="font-semibold text-ink text-base">{thread.name}</div>
                        <div className="text-xs text-ink-muted">{thread.author}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-gradient-to-r from-gold/10 to-amber/10 text-gold-dark border border-gold/20 text-xs font-semibold shadow-sm">{thread.genre}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-ink-muted mb-2">No threads for this book.</div>
              )}
            </div>
          </div>
          <div className="mb-6">
            <div className="mb-2 text-xs text-ink font-semibold">Notes & Review</div>
            <div className="rounded-xl border border-ink-muted/10 bg-cream/40 p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ink">Review</span>
                <button className="text-xs text-gold-dark underline flex items-center gap-1" onClick={() => setShowEdit(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.193 9.193a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l9.193-9.193zm.708-.708A1.5 1.5 0 0 0 12.146.146l-9.193 9.193a1.5 1.5 0 0 0-.33.45l-1.5 4a1.5 1.5 0 0 0 1.95 1.95l4-1.5a1.5 1.5 0 0 0 .45-.33l9.193-9.193a1.5 1.5 0 0 0 0-2.121l-2.292-2.292z"/></svg>
                  Edit review
                </button>
              </div>
              <div className="bg-ink-muted/5 rounded p-3 min-h-[60px]" style={{ fontFamily: 'Homemade Apple, cursive', fontSize: '1.1rem' }}>
                {form.notes || 'No notes for this book.'}
              </div>
            </div>
          </div>
          <div className="mb-6">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose/10 text-rose border border-rose/20 text-xs font-semibold hover:bg-rose/20 transition-all"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Delete Book
            </button>

            {/* Delete confirmation modal */}
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
                    >
                      Keep Book
                    </button>
                    <button
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose text-white hover:bg-rose/90 transition-colors"
                      onClick={handleDeleteBook}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Book deleted success card */}
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
