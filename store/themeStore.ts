import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setIsDark: (isDark: boolean) => void;
  initializeTheme: (systemIsDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark', // Set dark as default
      isDark: true, // Set dark as default
      
      setMode: (mode) => {
        set({ mode });
      },
      
      setIsDark: (isDark) => {
        set({ isDark });
      },
      
      initializeTheme: (systemIsDark) => {
        const { mode } = get();
        if (mode === 'system') {
          set({ isDark: systemIsDark });
        } else if (mode === 'dark') {
          set({ isDark: true });
        } else {
          set({ isDark: false });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);