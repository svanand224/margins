import { use } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function BookPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  const supabase = createClient();
  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .single();

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
