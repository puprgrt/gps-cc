import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  close: () => void;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: false,
  isCollapsed: true, // Otomatis minimize (collapsed) by default
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (isCollapsed) => set({ isCollapsed }),
}));
