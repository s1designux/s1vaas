import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const THEME_KEY = 's1vaas-theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const urlTheme = new URLSearchParams(window.location.search).get('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') {
    localStorage.setItem(THEME_KEY, urlTheme);
    return urlTheme;
  }
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  localStorage.setItem(THEME_KEY, 'light');
  return 'light';
}

function apply(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

const initial = readInitial();
apply(initial);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (t) => {
    localStorage.setItem(THEME_KEY, t);
    apply(t);
    set({ theme: t });
  },
  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    apply(next);
    set({ theme: next });
  },
}));
