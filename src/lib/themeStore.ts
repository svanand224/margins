'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'day' | 'night';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'day',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'day' ? 'night' : 'day',
        })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'reading-tracker-theme' }
  )
);
