import React, { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { useToast } from './hooks/useToast'
import { useSync } from './hooks/useSync'
import { seedDemoData } from './utils/db'
import { Toast } from './components/common/UI'
import Sidebar       from './components/layout/Sidebar'
import TopBar        from './components/layout/TopBar'
import LoginPage     from './components/pages/LoginPage'
import DashboardPage from './components/pages/DashboardPage'
import FeeCollectionPage from './components/pages/FeeCollectionPage'
import StudentsPage   from './components/pages/StudentsPage'
import ResultsPage    from './components/pages/ResultsPage'
import WhatsAppPage   from './components/pages/WhatsAppPage'
import DefaultersPage from './components/pages/DefaultersPage'
import ReportsPage    from './components/pages/ReportsPage'
import StationaryPage from './components/pages/StationaryPage'
import AttendancePage from './components/pages/AttendancePage'
import SettingsPage   from './components/pages/SettingsPage'

export default function App() {
  const {
    isLoggedIn, login, logout,
    currentPage, setPage,
    sidebarCollapsed, setSidebarCollapsed,
    darkMode,
  } = useAppStore()

  const { toasts, add: toast, remove: removeToast } = useToast()
  // Sync runs in background — never blocks render
  useSync()

  useEffect(() => {
    // Seed demo data into IndexedDB if empty
    seedDemoData().catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Show login page — always renders immediately, no loading state
  if (!isLoggedIn) {
    return (
      <>
        <Toast toasts={toasts} removeToast={removeToast}/>
        <LoginPage onLogin={(user, token) => {
          login(user, token)
          toast('Welcome back, Admin! 🎓', 'success')
        }}/>
      </>
    )
  }

  const pages = {
    dashboard:  <DashboardPage    setPage={setPage} toast={toast}/>,
    fee:        <FeeCollectionPage               toast={toast}/>,
    students:   <StudentsPage                    toast={toast}/>,
    results:    <ResultsPage                     toast={toast}/>,
    whatsapp:   <WhatsAppPage                    toast={toast}/>,
    defaulters: <DefaultersPage                  toast={toast}/>,
    reports:    <ReportsPage                     toast={toast}/>,
    stationary: <StationaryPage                  toast={toast}/>,
    attendance: <AttendancePage                  toast={toast}/>,
    settings:   <SettingsPage                    toast={toast}/>,
  }

  const marginLeft = sidebarCollapsed ? 64 : 240

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Toast toasts={toasts} removeToast={removeToast}/>

      <Sidebar
        page={currentPage}
        setPage={setPage}
        onLogout={() => { logout(); toast('Logged out.', 'info') }}
        collapsed={sidebarCollapsed}
      />

      <div style={{ marginLeft, transition: 'margin-left 0.25s ease', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar
          page={currentPage}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <main className="flex-1 overflow-auto">
          {pages[currentPage] || pages.dashboard}
        </main>
      </div>
    </div>
  )
}
