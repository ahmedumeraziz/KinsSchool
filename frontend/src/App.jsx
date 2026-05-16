import React, { useEffect, useRef, memo, useCallback } from 'react'
import { useAppStore, useNav } from './store/appStore'
import { useToast } from './hooks/useToast'
import { useOnlineSync } from './hooks/useOnlineSync'
import { seedDemoData } from './utils/db'
import { Toast } from './components/common/UI'
import Sidebar           from './components/layout/Sidebar'
import TopBar            from './components/layout/TopBar'
import LoginPage         from './components/pages/LoginPage'
import DashboardPage     from './components/pages/DashboardPage'
import FeeCollectionPage from './components/pages/FeeCollectionPage'
import StudentsPage      from './components/pages/StudentsPage'
import WhatsAppPage      from './components/pages/WhatsAppPage'
import DefaultersPage    from './components/pages/DefaultersPage'
import ReportsPage       from './components/pages/ReportsPage'
import StationaryPage    from './components/pages/StationaryPage'
import SettingsPage      from './components/pages/SettingsPage'

const PAGES = {
  dashboard:  DashboardPage,
  fee:        FeeCollectionPage,
  students:   StudentsPage,
  whatsapp:   WhatsAppPage,
  defaulters: DefaultersPage,
  reports:    ReportsPage,
  stationary: StationaryPage,
  settings:   SettingsPage,
}

const AppLayout = memo(({ toastRef }) => {
  const { currentPage, setPage, sidebarCollapsed, setSidebarCollapsed } = useNav()
  const PageComponent = PAGES[currentPage] || PAGES.dashboard
  const toast = useCallback((...args) => toastRef.current?.(...args), [toastRef])
  const handleLogout = useCallback(() => {
    useAppStore.getState().logout()
    toastRef.current?.('Logged out.', 'info')
  }, [toastRef])

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar
        page={currentPage}
        setPage={setPage}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
      />
      <div style={{
        marginLeft: sidebarCollapsed ? 64 : 240,
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <TopBar setSidebarCollapsed={setSidebarCollapsed} />
        <main className="flex-1 overflow-auto">
          <PageComponent toast={toast} setPage={setPage} />
        </main>
      </div>
    </div>
  )
})

export default function App() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn)
  const login      = useAppStore((s) => s.login)
  const darkMode   = useAppStore((s) => s.darkMode)

  const { toasts, add: toast, remove: removeToast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])

  useOnlineSync(toast)

  useEffect(() => { seedDemoData().catch(() => {}) }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      {isLoggedIn
        ? <AppLayout toastRef={toastRef} />
        : <LoginPage onLogin={(user, token) => {
            login(user, token)
            toast('Welcome back, Admin! 🎓', 'success')
          }} />
      }
    </>
  )
}
