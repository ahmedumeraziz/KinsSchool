import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      // ── Auth ──────────────────────────────────────────
      isLoggedIn: false,
      user:       null,
      token:      null,
      login:  (user, token) => set({ isLoggedIn: true, user, token }),
      logout: ()            => set({ isLoggedIn: false, user: null, token: null }),

      // ── Navigation ────────────────────────────────────
      currentPage:      'dashboard',
      sidebarCollapsed: false,
      setPage:              (page) => set({ currentPage: page }),
      setSidebarCollapsed:  (v)    => set((s) => ({
        sidebarCollapsed: typeof v === 'function' ? v(s.sidebarCollapsed) : v
      })),

      // ── Theme ─────────────────────────────────────────
      darkMode:    false,
      toggleDark:  () => set((s) => ({ darkMode: !s.darkMode })),

      // ── Settings ──────────────────────────────────────
      sheetsUrl:    '',
      scriptUrl:    '',
      setSheetsUrl: (url) => set({ sheetsUrl: url }),
      setScriptUrl: (url) => set({ scriptUrl: url }),

      // ── Sync flags — kept in store but separated so only
      //    SyncBadge subscribes to them, not the whole app ──
      syncing:        false,
      lastSynced:     null,
      setSyncing:     (v) => set({ syncing: v }),
      setLastSynced:  (t) => set({ lastSynced: t }),

      // ── Students ──────────────────────────────────────
      students:       [],
      setStudents:    (students)     => set({ students }),
      addStudent:     (s)            => set((st) => ({ students: [...st.students, s] })),
      updateStudent:  (id, data)     => set((st) => ({ students: st.students.map((s) => s.id === id ? { ...s, ...data } : s) })),
      deleteStudent:  (id)           => set((st) => ({ students: st.students.filter((s) => s.id !== id) })),

      // ── Fees ──────────────────────────────────────────
      fees:       {},
      setFees:    (fees)            => set({ fees }),
      updateFee:  (studentId, data) => set((st) => ({ fees: { ...st.fees, [studentId]: data } })),

      // ── Receipts ──────────────────────────────────────
      receipts:   [],
      addReceipt: (r) => set((st) => ({ receipts: [r, ...st.receipts] })),

      // ── Attendance ────────────────────────────────────
      attendance: {},
      markAttendance: (date, studentId, status) =>
        set((st) => ({
          attendance: {
            ...st.attendance,
            [date]: { ...(st.attendance[date] || {}), [studentId]: status },
          },
        })),

      // ── Results ───────────────────────────────────────
      results:    [],
      setResults: (results) => set({ results }),
      addResult:  (r)       => set((st) => ({ results: [...st.results, r] })),

      // ── Inventory ─────────────────────────────────────
      inventory:    [],
      setInventory: (inventory) => set({ inventory }),
    }),
    {
      name: 'kins-school-store',
      // IMPORTANT: do NOT persist syncing/lastSynced — they are session-only
      partialize: (state) => ({
        isLoggedIn:       state.isLoggedIn,
        user:             state.user,
        token:            state.token,
        darkMode:         state.darkMode,
        sheetsUrl:        state.sheetsUrl,
        scriptUrl:        state.scriptUrl,
        currentPage:      state.currentPage,
        sidebarCollapsed: state.sidebarCollapsed,
        students:         state.students,
        fees:             state.fees,
        receipts:         state.receipts,
        attendance:       state.attendance,
        results:          state.results,
        inventory:        state.inventory,
      }),
    }
  )
)

// ── Granular selector hooks ────────────────────────────────
// Each one subscribes ONLY to the slice it needs.
// Components using these will NOT re-render when other slices change.

export const useAuth = () =>
  useAppStore((s) => ({
    isLoggedIn: s.isLoggedIn,
    user:       s.user,
    token:      s.token,
    login:      s.login,
    logout:     s.logout,
  }))

export const useNav = () =>
  useAppStore((s) => ({
    currentPage:          s.currentPage,
    setPage:              s.setPage,
    sidebarCollapsed:     s.sidebarCollapsed,
    setSidebarCollapsed:  s.setSidebarCollapsed,
  }))

// SyncBadge is the ONLY component that should use this
export const useSyncStatus = () =>
  useAppStore((s) => ({
    syncing:      s.syncing,
    lastSynced:   s.lastSynced,
  }))

export const useStudents = () =>
  useAppStore((s) => ({
    students:       s.students,
    setStudents:    s.setStudents,
    addStudent:     s.addStudent,
    updateStudent:  s.updateStudent,
    deleteStudent:  s.deleteStudent,
  }))

export const useFees = () =>
  useAppStore((s) => ({
    fees:       s.fees,
    setFees:    s.setFees,
    updateFee:  s.updateFee,
  }))

export const useSettings = () =>
  useAppStore((s) => ({
    sheetsUrl:    s.sheetsUrl,
    scriptUrl:    s.scriptUrl,
    setSheetsUrl: s.setSheetsUrl,
    setScriptUrl: s.setScriptUrl,
  }))
