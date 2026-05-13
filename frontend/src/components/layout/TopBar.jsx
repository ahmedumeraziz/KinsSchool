import React, { useState, useEffect } from 'react'
import { Icon } from '../common/UI'
import { useAppStore } from '../../store/appStore'

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

export default function TopBar({ page, sidebarCollapsed, setSidebarCollapsed }) {
  const { syncing, lastSynced, darkMode, toggleDark } = useAppStore()
  const [now, setNow] = useState(new Date())
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(t); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-5 gap-4 sticky top-0 z-40 shadow-sm shrink-0">
      {/* Menu toggle */}
      <button onClick={() => setSidebarCollapsed(p => !p)}
        className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition-colors">
        <Icon name="menu" size={20} />
      </button>

      {/* Page title */}
      <h1 className="text-base font-bold text-slate-900 hidden sm:block">{PAGE_TITLES[page]}</h1>

      <div className="ml-auto flex items-center gap-4">
        {/* Date/time */}
        <div className="hidden md:block text-xs font-mono-num text-slate-500">
          {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          &nbsp; {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Online/offline */}
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${online ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync status */}
        <div className={`flex items-center gap-1.5 text-xs ${syncing ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={syncing ? 'animate-spin-anim' : ''}><Icon name="sync" size={14} /></span>
          <span className="hidden sm:inline">{syncing ? 'Syncing…' : lastSynced ? 'Synced' : 'Not synced'}</span>
        </div>

        {/* Dark mode */}
        <button onClick={toggleDark} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <Icon name={darkMode ? 'sun' : 'moon'} size={17} />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}
