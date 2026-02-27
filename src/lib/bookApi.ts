import { Book } from './types';

interface OpenLibraryBook {
  title: string;
  authors?: { name: string }[];
  number_of_pages?: number;
  covers?: number[];
  subjects?: { name: string }[];
}

interface GoogleBooksVolume {
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

export async function fetchBookByISBN(isbn: string): Promise<Partial<Book> | null> {
  try {
    // Try Google Books first for better cover images
    const googleRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const googleData = await googleRes.json();

    if (googleData.items && googleData.items.length > 0) {
      const vol: GoogleBooksVolume = googleData.items[0];
      const info = vol.volumeInfo;
      return {
        title: info.title,
        author: info.authors?.join(', ') || 'Unknown Author',
        isbn,
        totalPages: info.pageCount || 0,
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        genre: info.categories?.[0] || 'Fiction',
        notes: info.description || '',
      };
    }

    // Fallback to Open Library
    const olRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!olRes.ok) return null;
    const olData: OpenLibraryBook = await olRes.json();

    let authorName = 'Unknown Author';
    if (olData.authors && olData.authors.length > 0) {
      // Open Library returns author refs, need to fetch
      const authorKey = (olData as unknown as { authors: { key: string }[] }).authors[0].key;
      const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
      const authorData = await authorRes.json();
      authorName = authorData.name || 'Unknown Author';
    }

    return {
      title: olData.title,
      author: authorName,
      isbn,
      totalPages: olData.number_of_pages || 0,
      coverUrl: olData.covers
        ? `https://covers.openlibrary.org/b/id/${olData.covers[0]}-L.jpg`
        : '',
      genre: olData.subjects?.[0]?.name || 'Fiction',
    };
  } catch {
    return null;
  }
}

export async function fetchBookByURL(url: string): Promise<Partial<Book> | null> {
  try {
    // Extract ISBN from common book URLs
    let isbn = '';

    // Amazon URL
    const amazonMatch = url.match(/\/dp\/(\w{10})/);
    if (amazonMatch) {
      // ASIN might be ISBN-10
      isbn = amazonMatch[1];
    }

    // Goodreads - try to extract from URL
    const goodreadsMatch = url.match(/goodreads\.com\/book\/show\/(\d+)/);
    if (goodreadsMatch) {
      // Search by Goodreads title from URL
      const slug = url.split('/').pop()?.replace(/-/g, ' ').replace(/\.\w+$/, '') || '';
      const words = slug.split(' ').filter(w => isNaN(Number(w))).slice(0, 3).join('+');
      if (words) {
        return fetchBookBySearch(words);
      }
    }

    // Generic ISBN extraction from URL
    const isbnMatch = url.match(/(\d{13}|\d{10})/);
    if (isbnMatch) {
      isbn = isbnMatch[1];
    }

    if (isbn) {
      return fetchBookByISBN(isbn);
    }

    // Try searching with URL parts
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const searchTerm = pathParts[pathParts.length - 1]?.replace(/[-_]/g, ' ') || '';
    if (searchTerm) {
      return fetchBookBySearch(searchTerm);
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchBookBySearch(query: string): Promise<Partial<Book> | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    );
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const vol: GoogleBooksVolume = data.items[0];
      const info = vol.volumeInfo;
      const isbn = info.industryIdentifiers?.find(
        (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      return {
        title: info.title,
        author: info.authors?.join(', ') || 'Unknown Author',
        isbn: isbn || '',
        totalPages: info.pageCount || 0,
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        genre: info.categories?.[0] || 'Fiction',
        notes: info.description || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchBooks(query: string): Promise<Partial<Book>[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
    );
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: GoogleBooksVolume) => {
      const info = item.volumeInfo;
      const isbn = info.industryIdentifiers?.find(
        (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      return {
        title: info.title,
        author: info.authors?.join(', ') || 'Unknown Author',
        isbn: isbn || '',
        totalPages: info.pageCount || 0,
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        genre: info.categories?.[0] || 'Fiction',
        notes: info.description || '',
      };
    });
  } catch {
    return [];
  }
}
