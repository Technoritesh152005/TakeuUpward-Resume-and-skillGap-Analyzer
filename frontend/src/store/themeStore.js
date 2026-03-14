import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' or 'dark'
      
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          
          // Update document class
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          return { theme: newTheme };
        }),
      
      setTheme: (theme) =>
        set(() => {
          // Update document class
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          return { theme };
        }),
    }),
    {
      name: 'theme-storage', // localStorage key
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);

export default useThemeStore;