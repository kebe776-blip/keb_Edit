import { create } from 'zustand'

interface AppState {
  selectedSchoolId: string | null
  selectedSchoolYearId: string | null
  currentView: string
  isOnline: boolean
  sidebarOpen: boolean
  setSelectedSchool: (id: string) => void
  setSelectedSchoolYear: (id: string) => void
  setCurrentView: (view: string) => void
  setOnline: (online: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedSchoolId: null,
  selectedSchoolYearId: null,
  currentView: 'dashboard',
  isOnline: true,
  sidebarOpen: true,
  setSelectedSchool: (id) => set({ selectedSchoolId: id }),
  setSelectedSchoolYear: (id) => set({ selectedSchoolYearId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  setOnline: (online) => set({ isOnline: online }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
