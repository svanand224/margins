// ...existing code...
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Book } from '@/lib/types';
import { useState } from 'react';

export default async function BookPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  const supabase = createClient();
  // Get current user from cookie/session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your book details.</div>;
  }

  // Fetch current user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('reader_name, reading_data')
    .eq('id', user.id)
    .single();

  let book: Book | undefined = undefined;
  if (profile && profile.reading_data && Array.isArray(profile.reading_data.books)) {
    book = profile.reading_data.books.find((b: Book) => b.id === params.id);
  }

  // Debug output for params and query result
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-amber/10 text-xs p-2 mb-2 rounded-xl">
          <strong>Debug:</strong>
          <div>params.id: {params.id}</div>
          <div>error: {error ? JSON.stringify(error) : 'none'}</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(book, null, 2)}</pre>
        </div>
        {book ? (
          <>
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-lg text-ink-muted mb-4">by {book.author || 'Unknown Author'}</p>
            {book.coverUrl && (
              <img src={book.coverUrl} alt={book.title} className="w-40 h-60 object-cover rounded-lg mb-4" />
            )}
            <div className="text-sm text-ink-muted mb-2">Status: {book.status}</div>
            <div className="text-sm text-ink-muted mb-2">Pages: {book.totalPages || '—'}</div>
            <div className="text-sm text-ink-muted mb-2">Rating: {book.rating ? book.rating.toFixed(1) : '—'}</div>
            <div className="text-sm text-ink-muted mb-2">Progress: {book.currentPage} / {book.totalPages}</div>
            <div className="mt-6 text-ink">{book.notes || 'No notes for this book.'}</div>
          </>
        ) : (
          <div className="text-rose-700">Book not found in your library.</div>
        )}
      </div>
    );
  }

  if (error || !book) {
    notFound();
  }

  // Calculate progress
  const progress = book!.totalPages > 0 ? Math.round((book!.currentPage / book!.totalPages) * 100) : 0;
  const pagesRemaining = book!.totalPages > 0 ? book!.totalPages - book!.currentPage : 0;

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    status: book!.status,
    currentPage: book!.currentPage,
    rating: book!.rating || 0,
    notes: book!.notes || '',
  });

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'rating' || name === 'currentPage' ? Number(value) : value }));
  };

  const handleEditSave = async () => {
    // Save to Supabase
    const supabase = createClient();
    // Fetch profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reading_data')
      .eq('id', user.id)
      .single();
    if (!profile) return;
    const books = profile.reading_data.books.map((b: Book) =>
      b.id === book!.id ? { ...b, ...form } : b
    );
    await supabase
      .from('profiles')
      .update({ reading_data: { ...profile.reading_data, books } })
      .eq('id', user.id);
    setShowEdit(false);
    location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start gap-6">
        {book!.coverUrl && (
          <img src={book!.coverUrl} alt={book!.title} className="w-40 h-60 object-cover rounded-lg mb-4" />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">{book!.title}</h1>
          <p className="text-lg text-ink-muted mb-2">{book!.author || 'Unknown Author'}</p>
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{book!.genre}</span>
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{book!.totalPages} pages</span>
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{book!.status.charAt(0).toUpperCase() + book!.status.slice(1)}</span>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-amber/10 text-xs">Added {book!.dateAdded}</span>
            {book!.startDate && <span className="px-2 py-1 rounded bg-amber/10 text-xs">Started {book!.startDate}</span>}
            {book!.finishDate && <span className="px-2 py-1 rounded bg-amber/10 text-xs">Finished {book!.finishDate}</span>}
          </div>
          <div className="flex gap-1 mb-2">
            {[1,2,3,4,5].map(star => (
              <span key={star} className={star <= (book!.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            ))}
          </div>
          <button className="px-3 py-1 rounded bg-rose-100 text-rose-700 text-xs font-semibold mb-2" onClick={() => setShowEdit(true)}>Edit</button>
        </div>
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
              <input type="number" name="currentPage" value={form.currentPage} onChange={handleEditChange} className="w-full p-2 border rounded" min={0} max={book!.totalPages} />
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
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">Page {book!.currentPage} of {book!.totalPages}</span>
          <span className="text-sm font-bold">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-ink-muted/10 rounded-full overflow-hidden mb-1">
          <div className="h-3 bg-gradient-to-r from-pink-400 to-amber-400" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{pagesRemaining} pages remaining</span>
          <span className="underline cursor-pointer">Set page</span>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Reading Sessions</h2>
        {book!.sessions.length === 0 ? (
          <div className="text-ink-muted mb-2">No reading sessions yet. Log your first one!</div>
        ) : (
          <ul className="mb-2">
            {book!.sessions.map(session => (
              <li key={session.id} className="text-sm mb-1">{session.date}: {session.pagesRead} pages, {session.minutesSpent} min</li>
            ))}
          </ul>
        )}
        <button className="px-3 py-1 rounded bg-pink-100 text-pink-700 text-xs font-semibold">+ Log Session</button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Notes & Review</h2>
        <div className="bg-ink-muted/5 rounded p-3 min-h-[60px]">{book!.notes || 'No notes for this book.'}</div>
      </div>
    </div>
  );
}
