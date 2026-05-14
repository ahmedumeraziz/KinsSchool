import React, { useState, useEffect, memo } from 'react'
import { Icon } from '../common/UI'
import { useSyncStatus, useNav } from '../../store/appStore'

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  fee:        'Fee Collection',
  students:   'Students Management',
  results:    'Result Management',
  whatsapp:   'WhatsApp Messages',
  defaulters: 'Defaulter List',
  reports:    'Reports & Analytics',
  stationary: 'Stationary Shop',
  attendance: 'Daily Attendance',
  settings:   'Settings',
}

// Clock is isolated in its own component so only IT re-renders every second
const Clock = memo(() => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="hidden md:block text-xs font-mono-num text-slate-500 tabular-nums">
      {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      &nbsp;&nbsp;
      {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  )
})

// Online badge isolated so network changes don't re-render everything
const OnlineBadge = memo(() => {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${online ? 'text-emerald-600' : 'text-red-500'}`}>
      <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
    </div>
  )
})

// Sync badge reads only syncing/lastSynced
const SyncBadge = memo(() => {
  const { syncing, lastSynced } = useSyncStatus()
  return (
    <div className={`flex items-center gap-1.5 text-xs ${syncing ? 'text-blue-600' : 'text-slate-400'}`}>
      <span className={syncing ? 'animate-spin-anim' : ''}>
        <Icon name="sync" size={14} />
      </span>
      <span className="hidden sm:inline">
        {syncing ? 'Syncing…' : lastSynced ? 'Synced' : 'Local'}
      </span>
    </div>
  )
})

// TopBar itself only re-renders when page or sidebar state changes
const TopBar = memo(({ setSidebarCollapsed }) => {
  const { currentPage } = useNav()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-5 gap-4 sticky top-0 z-40 shadow-sm shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed((p) => !p)}
        className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition-colors"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* Page title */}
      <h1 className="text-base font-bold text-slate-900 hidden sm:block">
        {PAGE_TITLES[currentPage] || 'Dashboard'}
      </h1>

      <div className="ml-auto flex items-center gap-4">
        <Clock />
        <OnlineBadge />
        <SyncBadge />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer select-none">
          A
        </div>
      </div>
    </header>
  )
})

export default TopBar
