import { Moon, Sun } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
      ) : (
        <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
      )}
    </button>
  );
};

export default ThemeToggle;