import { create } from 'zustand';

export interface PageTab {
  id: string;       // unique key: pathname for route tabs, siteId for site tabs
  path: string;     // route to navigate to
  label: string;
  manualUrl?: string;
  siteId?: string;  // present on monitoring site tabs
  cameraCnt?: number;
}

interface UIState {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  // Page tabs
  openTabs: PageTab[];
  activeTabId: string;
  openTab: (tab: PageTab) => void;
  activateTab: (id: string) => void;
  closeTab: (id: string) => string | null;
  reorderTabs: (from: number, to: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),

  openTabs: [],
  activeTabId: '',

  // Register a tab; update display fields (label, cameraCnt) if already exists
  openTab: (tab) =>
    set((s) => {
      const idx = s.openTabs.findIndex((t) => t.id === tab.id);
      if (idx === -1) return { openTabs: [...s.openTabs, tab] };
      const updated = [...s.openTabs];
      updated[idx] = { ...updated[idx], label: tab.label, cameraCnt: tab.cameraCnt };
      return { openTabs: updated };
    }),

  // Set the active tab
  activateTab: (id) => set({ activeTabId: id }),

  // Remove a tab; returns the path to navigate to when removing the active tab
  closeTab: (id) => {
    const { openTabs, activeTabId } = get();
    const wasActive = activeTabId === id;
    const idx = openTabs.findIndex((t) => t.id === id);
    const remaining = openTabs.filter((t) => t.id !== id);

    let nextId = activeTabId;
    let nextPath: string | null = null;

    if (wasActive && remaining.length > 0) {
      const nextTab = remaining[idx] ?? remaining[idx - 1] ?? remaining[remaining.length - 1];
      nextId = nextTab.id;
      nextPath = nextTab.path;
    } else if (wasActive) {
      nextId = '';
    }

    set({ openTabs: remaining, activeTabId: nextId });
    return nextPath;
  },

  reorderTabs: (from, to) =>
    set((s) => {
      const tabs = [...s.openTabs];
      const [moved] = tabs.splice(from, 1);
      tabs.splice(to, 0, moved);
      return { openTabs: tabs };
    }),
}));
