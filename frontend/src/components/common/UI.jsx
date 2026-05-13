import React from 'react'

// ── ICONS ────────────────────────────────────────────────────────────────────
export const Icon = ({ name, size = 20, className = '' }) => {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0 }
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    dashboard:  <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    fee:        <svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    students:   <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    results:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    whatsapp:   <svg style={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
    reports:    <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    defaulter:  <svg style={s} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    stationary: <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    attendance: <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9,16 11,18 15,14"/></svg>,
    settings:   <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logout:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search:     <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    receipt:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>,
    plus:       <svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:      <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    print:      <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    sync:       <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    close:      <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    menu:       <svg style={s} viewBox="0 0 24 24" {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    check:      <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="20,6 9,17 4,12"/></svg>,
    download:   <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    eye:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    sun:        <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    calendar:   <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    wifi:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    wifiOff:    <svg style={s} viewBox="0 0 24 24" {...p}><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    phone:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l1.95-1.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>,
    user:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    home:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    alert:      <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    save:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
    link:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    qr:         <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><line x1="21" y1="15" x2="21" y2="21"/><line x1="15" y1="21" x2="21" y2="21"/><rect x="15" y="15" width="2" height="2"/></svg>,
    excel:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
    pdf:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
    filter:     <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>,
    bell:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    backup:     <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    restore:    <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  }
  return icons[name] || <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/></svg>
}

// ── BUTTON ───────────────────────────────────────────────────────────────────
const VARIANTS = {
  primary:   'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-sm hover:brightness-110',
  success:   'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0 shadow-sm hover:brightness-110',
  danger:    'bg-gradient-to-br from-red-500 to-red-700 text-white border-0 shadow-sm hover:brightness-110',
  amber:     'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-0 shadow-sm hover:brightness-110',
  ghost:     'bg-transparent text-slate-600 border border-slate-200 hover:bg-slate-50',
  outline:   'bg-white text-blue-700 border border-blue-600 hover:bg-blue-50',
  whatsapp:  'bg-gradient-to-br from-green-400 to-green-600 text-white border-0 shadow-sm hover:brightness-110',
  dark:      'bg-slate-800 text-white border-0 hover:bg-slate-700',
}
const SIZES = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export const Btn = ({ children, onClick, variant = 'primary', size = 'md', icon, disabled, className = '', type = 'button', style }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={style}
    className={`inline-flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
    {icon && <Icon name={icon} size={size === 'xs' || size === 'sm' ? 13 : 15} />}
    {children}
  </button>
)

// ── INPUT ────────────────────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, placeholder, type = 'text', prefix, suffix, className = '', required, readOnly, rows }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">{prefix}</span>}
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} readOnly={readOnly}
          className={`w-full border border-slate-200 rounded-lg text-sm font-body text-slate-800 bg-white resize-none outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${prefix ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} py-2`} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} readOnly={readOnly}
          className={`w-full border border-slate-200 rounded-lg text-sm font-body text-slate-800 bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${prefix ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} py-2`} />
      )}
      {suffix && <span className="absolute right-3 text-slate-400 pointer-events-none flex items-center">{suffix}</span>}
    </div>
  </div>
)

// ── SELECT ───────────────────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options, className = '', required }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg text-sm font-body text-slate-800 bg-white outline-none px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer">
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  </div>
)

// ── CARD ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${onClick ? 'cursor-pointer card-hover' : ''} ${className}`}>
    {children}
  </div>
)

// ── BADGE ────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  blue:  'bg-blue-50 text-blue-700 border border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  red:   'bg-red-50 text-red-600 border border-red-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  gray:  'bg-slate-100 text-slate-600 border border-slate-200',
  purple:'bg-purple-50 text-purple-700 border border-purple-200',
}

export const Badge = ({ children, color = 'blue', className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_COLORS[color]} ${className}`}>
    {children}
  </span>
)

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, sub, icon, color = 'blue', trend }) => {
  const bars = { blue: 'border-l-blue-600', green: 'border-l-emerald-500', amber: 'border-l-amber-500', red: 'border-l-red-500' }
  const icons = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' }
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${bars[color]} p-5 shadow-sm flex flex-col gap-3`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num leading-none">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${icons[color]}`}>
          <Icon name={icon} size={22} />
        </div>
      </div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
      {trend !== undefined && <div className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month</div>}
    </div>
  )
}

// ── TOAST ────────────────────────────────────────────────────────────────────
const TOAST_STYLES = {
  success: 'bg-emerald-600',
  error:   'bg-red-600',
  warn:    'bg-amber-500',
  info:    'bg-blue-600',
}
export const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl min-w-64 max-w-sm text-white text-sm font-medium shadow-2xl animate-slide-in pointer-events-auto ${TOAST_STYLES[t.type] || TOAST_STYLES.info}`}>
        <span className="flex-1">{t.msg}</span>
        <button onClick={() => removeToast(t.id)} className="text-white/80 hover:text-white transition-colors">
          <Icon name="close" size={14} />
        </button>
      </div>
    ))}
  </div>
)

// ── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col animate-fade-up`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><Icon name="close" size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
export const Empty = ({ icon = 'search', title = 'No data found', sub = '' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
      <Icon name={icon} size={26} />
    </div>
    <div className="font-semibold text-slate-600 text-sm">{title}</div>
    {sub && <div className="text-xs mt-1 text-center max-w-48">{sub}</div>}
  </div>
)

// ── LOADING SKELETON ──────────────────────────────────────────────────────────
export const Skeleton = ({ rows = 5 }) => (
  <div className="flex flex-col gap-3 p-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-10 rounded-lg skeleton" style={{ animationDelay: `${i * 0.08}s`, opacity: 1 - i * 0.1 }} />
    ))}
  </div>
)

// ── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, sub, children }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </div>
)

// ── DIVIDER ──────────────────────────────────────────────────────────────────
export const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-200" />
    {label && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">{label}</span>}
    <div className="flex-1 h-px bg-slate-200" />
  </div>
)
