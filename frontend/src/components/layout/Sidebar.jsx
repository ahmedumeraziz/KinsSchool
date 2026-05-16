import React, { memo } from 'react'
import { Icon } from '../common/UI'

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Dashboard',     icon: 'dashboard'  },
  { key: 'fee',        label: 'Fee Collection', icon: 'fee'        },
  { key: 'students',   label: 'Students',       icon: 'students'   },
  { key: 'whatsapp',   label: 'WhatsApp',       icon: 'whatsapp'   },
  { key: 'defaulters', label: 'Defaulters',     icon: 'defaulter', badge: true },
  { key: 'reports',    label: 'Reports',        icon: 'reports'    },
  { key: 'stationary', label: 'Stationary',     icon: 'stationary' },
  { key: 'settings',   label: 'Settings',       icon: 'settings'   },
]

const Sidebar = memo(({ page, setPage, onLogout, collapsed }) => (
  <aside
    className="fixed top-0 left-0 h-screen flex flex-col z-50 overflow-hidden"
    style={{ width: collapsed ? 64 : 240, background: '#0D1F5C', transition: 'width 0.25s ease' }}
  >
    {/* Logo */}
    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0 text-lg shadow-lg select-none">
        🎓
      </div>
      {!collapsed && (
        <div className="overflow-hidden">
          <div className="font-display font-bold text-white text-sm leading-tight whitespace-nowrap">KINS SCHOOL</div>
          <div className="text-[10px] text-blue-300 whitespace-nowrap">Management System</div>
        </div>
      )}
    </div>

    {/* Nav */}
    <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = page === item.key
        return (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
              'border-l-2 transition-colors duration-150',
              collapsed ? 'justify-center' : '',
              active
                ? 'bg-white/15 text-white border-emerald-400'
                : 'text-blue-200/80 border-transparent hover:bg-white/7 hover:text-white',
            ].join(' ')}
          >
            <Icon name={item.icon} size={18} />
            {!collapsed && (
              <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
            )}
            {!collapsed && item.badge && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-anim">
                !
              </span>
            )}
          </button>
        )
      })}
    </nav>

    {/* Logout */}
    <div className="px-2 py-3 border-t border-white/10 shrink-0">
      <button
        onClick={onLogout}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-colors duration-150 ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon name="logout" size={18} />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  </aside>
))

export default Sidebar
