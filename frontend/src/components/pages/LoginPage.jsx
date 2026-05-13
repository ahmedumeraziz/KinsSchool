import React, { useState } from 'react'
import { Icon } from '../common/UI'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!username || !password) { setError('Please enter username and password.'); return }
    setLoading(true)
    // Simulate auth — replace with real API call
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin({ username: 'admin', role: 'admin' }, 'demo-token-123')
      } else {
        setError('Invalid credentials. Use admin / admin123')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0D1F5C 0%,#1B4FD8 55%,#059669 100%)' }}>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Glow orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(5,150,105,0.18),transparent 70%)' }} />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(27,79,216,0.22),transparent 70%)' }} />

      <div className="w-full max-w-md px-4 animate-fade-up">
        <div className="glass-card rounded-3xl shadow-2xl p-10"
          style={{ boxShadow: '0 24px 80px rgba(13,31,92,0.35), 0 0 0 1px rgba(255,255,255,0.5)' }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl animate-float"
              style={{ background: 'linear-gradient(135deg,#1B4FD8,#059669)' }}>
              🎓
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">KINS SCHOOL</h1>
            <p className="text-sm text-slate-500 mt-1">Ratta Rd, Kins St, Gujranwala</p>
          </div>

          {/* Divider */}
          <div className="h-px mb-7" style={{ background: 'linear-gradient(to right,transparent,#E2E8F0,transparent)' }} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400"><Icon name="user" size={16} /></span>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white/70 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400"><Icon name="settings" size={16} /></span>
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="Enter password" autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-white/70 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 select-none">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
              Remember me
            </label>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <Icon name="alert" size={15} /> {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-base transition-all duration-150 active:scale-98 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 mt-1"
              style={{ background: 'linear-gradient(135deg,#1B4FD8,#059669)', boxShadow: '0 4px 20px rgba(27,79,216,0.35)' }}>
              {loading
                ? <><span className="animate-spin-anim inline-block">⟳</span> Signing in…</>
                : <><Icon name="check" size={18} /> Sign In to Dashboard</>
              }
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">Demo credentials: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  )
}
