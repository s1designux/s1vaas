import { create } from 'zustand';

const STORAGE_KEY = 's1vaas-hidden-menus';
const DEFAULT_HIDDEN = ['/cases', '/dispatch', '/health'];

function readHidden(): string[] {
  if (typeof window === 'undefined') return DEFAULT_HIDDEN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HIDDEN;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_HIDDEN;
  } catch {
    return DEFAULT_HIDDEN;
  }
}

interface MenuState {
  hiddenPaths: string[];
  setVisible: (path: string, visible: boolean) => void;
  applyAll: (hidden: string[]) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  hiddenPaths: readHidden(),

  setVisible: (path, visible) =>
    set((s) => {
      const next = visible
        ? s.hiddenPaths.filter((p) => p !== path)
        : [...s.hiddenPaths.filter((p) => p !== path), path];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { hiddenPaths: next };
    }),

  applyAll: (hidden) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
    set({ hiddenPaths: hidden });
  },
}));
