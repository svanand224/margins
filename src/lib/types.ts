export type ReadingStatus = 'want-to-read' | 'reading' | 'completed' | 'dnf';

export interface ReadingSession {
  id: string;
  date: string; // ISO string
  pagesRead: number;
  minutesSpent: number;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number;
  status: ReadingStatus;
  genre: string;
  rating?: number; // 1-5
  startDate?: string;
  finishDate?: string;
  dateAdded: string;
  notes?: string;
  review?: string;
  favorite: boolean;
  sessions: ReadingSession[];
  tags: string[];
}

export interface ReadingGoal {
  id: string;
  type: 'books-per-year' | 'pages-per-day' | 'minutes-per-day' | 'books-per-month';
  target: number;
  year: number;
  createdAt: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  pagesRead: number;
  minutesSpent: number;
  booksWorkedOn: string[]; // book IDs
}

export type SortOption = 'title' | 'author' | 'dateAdded' | 'rating' | 'progress';
export type ViewMode = 'grid' | 'list';

export interface Thread {
  id: string;
  name: string;
  description?: string;
  color: string; // CSS color or theme variable
  icon: 'paisley' | 'lotus' | 'vine' | 'elephant' | 'mandala' | 'default';
  bookIds: string[];
  isAutoGenre?: boolean; // auto-generated from genre grouping
  createdAt: string;
  coverUrl?: string;
  author?: string;
  genre?: string;
}
