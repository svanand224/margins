// ...existing code...
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Book } from '@/lib/types';

export default async function BookPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  const supabase = createClient();
  // Find the profile that contains this book
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('reader_name, reading_data')
    .contains('reading_data', { books: [{ id: params.id }] })
    .single();

  let book: Book | undefined;
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
            <div className="mt-6 text-ink">{book.notes || 'No notes for this book.'}</div>
          </>
        ) : (
          <div className="text-rose-700">Book not found.</div>
        )}
      </div>
    );
  }

  if (error || !book) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
      <p className="text-lg text-ink-muted mb-4">by {book.author || 'Unknown Author'}</p>
      {book.coverUrl && (
        <img src={book.coverUrl} alt={book.title} className="w-40 h-60 object-cover rounded-lg mb-4" />
      )}
      <div className="text-sm text-ink-muted mb-2">Status: {book.status}</div>
      <div className="text-sm text-ink-muted mb-2">Pages: {book.totalPages || '—'}</div>
      <div className="text-sm text-ink-muted mb-2">Rating: {book.rating ? book.rating.toFixed(1) : '—'}</div>
      <div className="mt-6 text-ink">{book.notes || 'No notes for this book.'}</div>
    </div>
  );
}
