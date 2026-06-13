import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Sidebar (admin)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Notifications
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: "absensi-app-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
