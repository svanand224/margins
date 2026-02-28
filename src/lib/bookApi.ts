import { Book } from './types';

interface OpenLibraryBook {
  title: string;
  authors?: { name: string }[];
  number_of_pages?: number;
  covers?: number[];
  subjects?: { name: string }[];
}

interface OpenLibrarySearchDoc {
  title: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
  first_sentence?: string[];
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
    // Try Open Library first (no API key / quota issues)
    const olRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (olRes.ok) {
      const olData: OpenLibraryBook = await olRes.json();

      let authorName = 'Unknown Author';
      if (olData.authors && olData.authors.length > 0) {
        const authorKey = (olData as unknown as { authors: { key: string }[] }).authors[0].key;
        try {
          const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
          const authorData = await authorRes.json();
          authorName = authorData.name || 'Unknown Author';
        } catch {
          // keep default
        }
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
    }

    // Fallback to Google Books
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

    return null;
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
      // Get everything after the numeric ID in the URL path
      const fullSlug = url.split('/').pop() || '';
      // Remove query params and hash
      const cleanSlug = fullSlug.split('?')[0].split('#')[0];

      // Goodreads URLs come in two formats:
      //   /book/show/5907.The_Hobbit_or_There_and_Back_Again
      //   /book/show/5907-the-hobbit
      // Extract title part after the ID
      const titlePart = cleanSlug
        .replace(/^\d+[.\-]?/, '')  // Remove leading ID and separator (. or -)
        .replace(/[_\-]/g, ' ')      // Convert underscores/hyphens to spaces
        .trim();

      if (titlePart) {
        const words = titlePart.split(/\s+/).slice(0, 5).join('+');
        if (words) {
          return fetchBookBySearch(words);
        }
      }

      // If no slug (e.g. just /book/show/5907), we can't search
      return null;
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
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=title,author_name,isbn,number_of_pages_median,cover_i,subject,first_sentence`
    );
    const data = await res.json();

    if (data.docs && data.docs.length > 0) {
      const doc: OpenLibrarySearchDoc = data.docs[0];
      return {
        title: doc.title,
        author: doc.author_name?.join(', ') || 'Unknown Author',
        isbn: doc.isbn?.[0] || '',
        totalPages: doc.number_of_pages_median || 0,
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : '',
        genre: doc.subject?.[0] || 'Fiction',
        notes: doc.first_sentence?.[0] || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchBooks(query: string): Promise<Partial<Book>[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,isbn,number_of_pages_median,cover_i,subject,first_sentence`
  );

  if (!res.ok) {
    throw new Error(`Search failed with status ${res.status}`);
  }

  const data = await res.json();

  if (!data.docs || data.docs.length === 0) return [];

  return data.docs.map((doc: OpenLibrarySearchDoc) => ({
    title: doc.title,
    author: doc.author_name?.join(', ') || 'Unknown Author',
    isbn: doc.isbn?.[0] || '',
    totalPages: doc.number_of_pages_median || 0,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : '',
    genre: doc.subject?.[0] || 'Fiction',
    notes: doc.first_sentence?.[0] || '',
  }));
}
