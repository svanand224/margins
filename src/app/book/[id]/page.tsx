
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Book } from '@/lib/types';
import { useState, useEffect } from 'react';

export default function BookPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    status: '',
    currentPage: 0,
    rating: 0,
    notes: '',
  });

  useEffect(() => {
    async function fetchBook() {
      if (!isSupabaseConfigured()) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view your book details.');
        setLoading(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('reading_data')
        .eq('id', user.id)
        .single();
      if (profileError) {
        setError('Error fetching profile');
        setLoading(false);
        return;
      }
      if (profile && profile.reading_data && Array.isArray(profile.reading_data.books)) {
        const foundBook = profile.reading_data.books.find((b: Book) => b.id === params.id);
        if (foundBook) {
          setBook(foundBook);
          setForm({
            status: foundBook.status,
            currentPage: foundBook.currentPage,
            rating: foundBook.rating || 0,
            notes: foundBook.notes || '',
          });
        } else {
          setError('Book not found in your library.');
        }
      } else {
        setError('No books found for user.');
      }
      setLoading(false);
    }
    fetchBook();
  }, [params.id]);

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'rating' || name === 'currentPage' ? Number(value) : value }));
  };

  const handleEditSave = async () => {
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
    const books = profile.reading_data.books.map((b: Book) =>
      b.id === book.id ? { ...b, ...form } : b
    );
    await supabase
      .from('profiles')
      .update({ reading_data: { ...profile.reading_data, books } })
      .eq('id', user.id);
    setShowEdit(false);
    setBook({ ...book, ...form });
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start gap-6">
        {book.coverUrl && (
          <img src={book.coverUrl} alt={book.title} className="w-40 h-60 object-cover rounded-lg mb-4" />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-lg text-ink-muted mb-2">{book.author || 'Unknown Author'}</p>
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{book.genre}</span>
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{book.totalPages} pages</span>
            <span className="px-2 py-1 rounded bg-ink-muted/10 text-xs">{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-amber/10 text-xs">Added {book.dateAdded}</span>
            {book.startDate && <span className="px-2 py-1 rounded bg-amber/10 text-xs">Started {book.startDate}</span>}
            {book.finishDate && <span className="px-2 py-1 rounded bg-amber/10 text-xs">Finished {book.finishDate}</span>}
          </div>
          <div className="flex gap-1 mb-2">
            {[1,2,3,4,5].map(star => (
              <span key={star} className={star <= (form.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
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
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">Page {form.currentPage} of {book.totalPages}</span>
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
        {book.sessions.length === 0 ? (
          <div className="text-ink-muted mb-2">No reading sessions yet. Log your first one!</div>
        ) : (
          <ul className="mb-2">
            {book.sessions.map(session => (
              <li key={session.id} className="text-sm mb-1">{session.date}: {session.pagesRead} pages, {session.minutesSpent} min</li>
            ))}
          </ul>
        )}
        <button className="px-3 py-1 rounded bg-pink-100 text-pink-700 text-xs font-semibold">+ Log Session</button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Notes & Review</h2>
        <div className="bg-ink-muted/5 rounded p-3 min-h-[60px]">{form.notes || 'No notes for this book.'}</div>
      </div>
    </div>
  );
}
