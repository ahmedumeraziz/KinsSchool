import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      isLoggedIn: false,
      user: null,
      token: null,
      login: (user, token) => set({ isLoggedIn: true, user, token }),
      logout: () => set({ isLoggedIn: false, user: null, token: null }),

      // Navigation
      currentPage: 'dashboard',
      setPage: (page) => set({ currentPage: page }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Theme
      darkMode: false,
      toggleDark: () => set(s => ({ darkMode: !s.darkMode })),

      // Settings
      sheetsUrl: '',
      scriptUrl: '',
      setSheetsUrl: (url) => set({ sheetsUrl: url }),
      setScriptUrl: (url) => set({ scriptUrl: url }),
      syncInterval: 10000,

      // Sync state
      syncing: false,
      lastSynced: null,
      setSyncing: (v) => set({ syncing: v }),
      setLastSynced: (t) => set({ lastSynced: t }),

      // Students
      students: [],
      setStudents: (students) => set({ students }),
      addStudent: (s) => set(st => ({ students: [...st.students, s] })),
      updateStudent: (id, data) => set(st => ({ students: st.students.map(s => s.id === id ? { ...s, ...data } : s) })),
      deleteStudent: (id) => set(st => ({ students: st.students.filter(s => s.id !== id) })),

      // Fees
      fees: {},
      setFees: (fees) => set({ fees }),
      updateFee: (studentId, data) => set(st => ({ fees: { ...st.fees, [studentId]: data } })),

      // Receipts
      receipts: [],
      addReceipt: (r) => set(st => ({ receipts: [r, ...st.receipts] })),

      // Attendance
      attendance: {},
      markAttendance: (date, studentId, status) => set(st => ({
        attendance: { ...st.attendance, [date]: { ...(st.attendance[date] || {}), [studentId]: status } }
      })),

      // Results
      results: [],
      setResults: (results) => set({ results }),
      addResult: (r) => set(st => ({ results: [...st.results, r] })),

      // Stationary inventory
      inventory: [],
      setInventory: (inventory) => set({ inventory }),
    }),
    {
      name: 'kins-school-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        darkMode: state.darkMode,
        sheetsUrl: state.sheetsUrl,
        scriptUrl: state.scriptUrl,
        students: state.students,
        fees: state.fees,
        receipts: state.receipts,
        attendance: state.attendance,
        results: state.results,
        inventory: state.inventory,
      })
    }
  )
)
