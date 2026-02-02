import { create } from 'zustand';
import { sqlPro } from '@/lib/api';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  /** 实际解析后的主题 (light 或 dark)，用于 Monaco Editor 等组件同步 */
  resolvedTheme: 'light' | 'dark';
  isLoading: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
  toggleTheme: () => void;
}

// 计算解析后的主题
function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

// Apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = getResolvedTheme(theme);

  if (resolved === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  return resolved;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme:
    typeof window !== 'undefined' ? getResolvedTheme('system') : 'light',
  isLoading: false,

  loadTheme: async () => {
    set({ isLoading: true });
    try {
      const result = await sqlPro.app.getPreferences();
      if (result.success && result.preferences) {
        const prefs = result.preferences as { theme?: Theme };
        const theme = prefs.theme || 'system';
        const resolvedTheme = applyTheme(theme);
        set({ theme, resolvedTheme, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    // Optimistically update UI
    const resolvedTheme = applyTheme(theme);
    set({ theme, resolvedTheme });

    // Persist to main process
    try {
      const result = (await sqlPro.app.setPreferences({
        preferences: { theme },
      })) as { success: boolean; error?: string };
      if (!result.success) {
        // Revert on failure
        const currentTheme = get().theme;
        const revertedResolved = applyTheme(currentTheme);
        set({ resolvedTheme: revertedResolved });
        console.error('Failed to save theme:', result.error);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },

  toggleTheme: () => {
    const { theme, setTheme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  },
}));

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme } = useThemeStore.getState();
      if (theme === 'system') {
        const resolvedTheme = applyTheme('system');
        // 触发状态更新，让订阅组件重新渲染
        useThemeStore.setState({ resolvedTheme });
      }
    });
}
