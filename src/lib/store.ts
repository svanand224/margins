'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Book, ReadingGoal, ReadingSession, ReadingStatus, DailyLog, Thread } from './types';

interface BookStore {
  books: Book[];
  goals: ReadingGoal[];
  dailyLogs: DailyLog[];
  threads: Thread[];
  readerName: string;

  // Book actions
  addBook: (book: Omit<Book, 'id' | 'dateAdded' | 'sessions' | 'favorite'>) => string;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateProgress: (id: string, currentPage: number) => void;
  updateStatus: (id: string, status: ReadingStatus) => void;

  // Session actions
  addSession: (bookId: string, session: Omit<ReadingSession, 'id'>) => void;
  deleteSession: (bookId: string, sessionId: string) => void;

  // Goal actions
  addGoal: (goal: Omit<ReadingGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<ReadingGoal>) => void;
  deleteGoal: (id: string) => void;

  // Thread actions
  addThread: (thread: Omit<Thread, 'id' | 'createdAt'>) => string;
  updateThread: (id: string, updates: Partial<Thread>) => void;
  deleteThread: (id: string) => void;
  addBookToThread: (threadId: string, bookId: string) => void;
  removeBookFromThread: (threadId: string, bookId: string) => void;

  // Daily log
  logDaily: (date: string, pagesRead: number, minutesSpent: number, bookId: string) => void;

  // Settings
  setReaderName: (name: string) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],
      goals: [],
      dailyLogs: [],
      threads: [],
      readerName: 'Sasha',

      addBook: (bookData) => {
        const id = uuidv4();
        const newBook: Book = {
          ...bookData,
          id,
          dateAdded: new Date().toISOString(),
          sessions: [],
          favorite: false,
          tags: bookData.tags || [],
        };
        set((state) => ({ books: [...state.books, newBook] }));
        return id;
      },

      updateBook: (id, updates) => {
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
      },

      deleteBook: (id) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          threads: state.threads.map((t) => ({
            ...t,
            bookIds: t.bookIds.filter((bid) => bid !== id),
          })),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, favorite: !b.favorite } : b
          ),
        }));
      },

      updateProgress: (id, currentPage) => {
        const book = get().books.find(b => b.id === id);
        const prevPage = book?.currentPage || 0;
        set((state) => ({
          books: state.books.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, currentPage };
            if (currentPage >= b.totalPages && b.status === 'reading') {
              updated.status = 'completed';
              updated.finishDate = new Date().toISOString();
              updated.currentPage = b.totalPages;
            }
            if (currentPage > 0 && b.status === 'want-to-read') {
              updated.status = 'reading';
              updated.startDate = updated.startDate || new Date().toISOString();
            }
            return updated;
          }),
        }));
        // Log the page difference as daily activity
        const pagesRead = currentPage - prevPage;
        if (pagesRead > 0) {
          const today = new Date().toISOString().split('T')[0];
          get().logDaily(today, pagesRead, 0, id);
        }
      },

      updateStatus: (id, status) => {
        set((state) => ({
          books: state.books.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, status };
            if (status === 'reading' && !b.startDate) {
              updated.startDate = new Date().toISOString();
            }
            if (status === 'completed') {
              updated.finishDate = new Date().toISOString();
              updated.currentPage = b.totalPages;
            }
            return updated;
          }),
        }));
      },

      addSession: (bookId, sessionData) => {
        const session: ReadingSession = { ...sessionData, id: uuidv4() };
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId
              ? { ...b, sessions: [...b.sessions, session] }
              : b
          ),
        }));
        // Also log daily
        const dateKey = sessionData.date.split('T')[0];
        get().logDaily(dateKey, sessionData.pagesRead, sessionData.minutesSpent, bookId);
      },

      deleteSession: (bookId, sessionId) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId
              ? { ...b, sessions: b.sessions.filter((s) => s.id !== sessionId) }
              : b
          ),
        }));
      },

      addGoal: (goalData) => {
        const goal: ReadingGoal = {
          ...goalData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, goal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      },

      addThread: (threadData) => {
        const id = uuidv4();
        const newThread: Thread = {
          ...threadData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ threads: [...state.threads, newThread] }));
        return id;
      },

      updateThread: (id, updates) => {
        set((state) => ({
          threads: state.threads.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteThread: (id) => {
        set((state) => ({ threads: state.threads.filter((t) => t.id !== id) }));
      },

      addBookToThread: (threadId, bookId) => {
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId && !t.bookIds.includes(bookId)
              ? { ...t, bookIds: [...t.bookIds, bookId] }
              : t
          ),
        }));
      },

      removeBookFromThread: (threadId, bookId) => {
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, bookIds: t.bookIds.filter((id) => id !== bookId) }
              : t
          ),
        }));
      },

      logDaily: (date, pagesRead, minutesSpent, bookId) => {
        set((state) => {
          const existing = state.dailyLogs.find((l) => l.date === date);
          if (existing) {
            return {
              dailyLogs: state.dailyLogs.map((l) =>
                l.date === date
                  ? {
                      ...l,
                      pagesRead: l.pagesRead + pagesRead,
                      minutesSpent: l.minutesSpent + minutesSpent,
                      booksWorkedOn: [...new Set([...l.booksWorkedOn, bookId])],
                    }
                  : l
              ),
            };
          }
          return {
            dailyLogs: [
              ...state.dailyLogs,
              { date, pagesRead, minutesSpent, booksWorkedOn: [bookId] },
            ],
          };
        });
      },

      setReaderName: (name) => set({ readerName: name }),
    }),
    {
      name: 'reading-tracker-storage',
    }
  )
);
