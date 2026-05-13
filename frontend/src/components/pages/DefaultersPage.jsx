import React, { useState } from 'react'
import { Card, Btn, Badge, Icon, PageHeader, Empty, StatCard } from '../common/UI'
import { formatRs, buildWhatsAppLink, defaulterMsg, SCHOOL_MONTHS, exportCSV } from '../../utils/helpers'

const DEMO_DEFAULTERS = [
  { id: 1, name: 'Ahmed Raza',   father: 'Muhammad Raza', class: 'Class 5', fatherCell: '0300-1234567', unpaidMonths: ['March','April'], totalDue: 3000,  status: 'strict'  },
  { id: 2, name: 'Sara Malik',   father: 'Tariq Malik',   class: 'Class 3', fatherCell: '0311-2345678', unpaidMonths: ['February','March','April'], totalDue: 5950, status: 'strict' },
  { id: 3, name: 'Bilal Hassan', father: 'Asif Hassan',   class: 'Class 6', fatherCell: '0300-1234567', unpaidMonths: ['February','March','April'], totalDue: 5000, status: 'strict' },
  { id: 4, name: 'Fatima Khan',  father: 'Imran Khan',    class: 'Class 8', fatherCell: '0333-4567890', unpaidMonths: ['March','April'], totalDue: 5500, status: 'grace'  },
  { id: 5, name: 'Zainab Iqbal', father: 'Naveed Iqbal',  class: 'Class 4', fatherCell: '0344-5678901', unpaidMonths: ['April'], totalDue: 750,  status: 'first'  },
  { id: 6, name: 'Ali Hassan',   father: 'Noman Hassan',  class: 'Class 9', fatherCell: '0355-6789012', unpaidMonths: ['March','April'], totalDue: 5000, status: 'grace'  },
]

const STATUS_META = {
  strict: { label: 'Strict (2+ months)', color: 'red',   icon: '🔴' },
  grace:  { label: 'Grace Period',       color: 'amber', icon: '🟡' },
  first:  { label: 'First Time',         color: 'blue',  icon: '🔵' },
}

export default function DefaultersPage({ toast }) {
  const [classFilter, setClass] = useState('All')
  const [statusFilter, setStatus] = useState('All')
  const [sending, setSending] = useState(null)
  const now = new Date()
  const monthYear = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  const filtered = DEMO_DEFAULTERS.filter(d => {
    const mc = classFilter === 'All' || d.class === classFilter
    const ms = statusFilter === 'All' || d.status === statusFilter
    return mc && ms
  })

  const totalDue = filtered.reduce((a, d) => a + d.totalDue, 0)

  const sendWA = (d) => {
    setSending(d.id)
    const msg = defaulterMsg(d, d.unpaidMonths, d.totalDue)
    window.open(buildWhatsAppLink(d.fatherCell, msg), '_blank')
    setTimeout(() => setSending(null), 1500)
    toast(`WhatsApp opened for ${d.name}`, 'success')
  }

  const sendBulk = () => {
    filtered.forEach((d, i) => {
      setTimeout(() => {
        const msg = defaulterMsg(d, d.unpaidMonths, d.totalDue)
        window.open(buildWhatsAppLink(d.fatherCell, msg), '_blank')
      }, i * 600)
    })
    toast(`Opening WhatsApp for ${filtered.length} defaulters…`, 'info')
  }

  const handleExport = () => {
    exportCSV(filtered.map(d => ({
      Name: d.name, Father: d.father, Class: d.class,
      Cell: d.fatherCell, 'Unpaid Months': d.unpaidMonths.join(', '),
      'Total Due': d.totalDue, Status: d.status
    })), `Defaulters-${monthYear}.csv`)
    toast('CSV exported!', 'success')
  }

  const classes = ['All', ...new Set(DEMO_DEFAULTERS.map(d => d.class))]

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Defaulter List" sub={`Auto-generated for ${monthYear} • Runs on 10th of every month`}>
        <Btn onClick={handleExport} variant="ghost" icon="excel" size="sm">Export CSV</Btn>
        <Btn onClick={() => window.print()} variant="ghost" icon="print" size="sm">Print</Btn>
        <Btn onClick={sendBulk} variant="whatsapp" icon="whatsapp">Bulk WhatsApp ({filtered.length})</Btn>
      </PageHeader>

      {/* Alert banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
        <span className="text-2xl mt-0.5">⚠️</span>
        <div>
          <div className="font-bold text-red-800">Monthly Defaulter Alert</div>
          <div className="text-sm text-red-600 mt-0.5">
            <strong>{DEMO_DEFAULTERS.length}</strong> students have not paid their fee for <strong>{monthYear}</strong>.
            Total outstanding: <strong>{formatRs(DEMO_DEFAULTERS.reduce((a, d) => a + d.totalDue, 0))}</strong>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-red-500">
            <span>🔴 Strict (2+ months): {DEMO_DEFAULTERS.filter(d => d.status === 'strict').length}</span>
            <span>🟡 Grace Period: {DEMO_DEFAULTERS.filter(d => d.status === 'grace').length}</span>
            <span>🔵 First Time: {DEMO_DEFAULTERS.filter(d => d.status === 'first').length}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Defaulters" value={filtered.length.toString()} icon="defaulter" color="red" />
        <StatCard title="Total Pending" value={`Rs.${(totalDue/1000).toFixed(1)}K`} icon="fee" color="amber" />
        <StatCard title="Strict Cases" value={filtered.filter(d=>d.status==='strict').length.toString()} icon="alert" color="red" />
        <StatCard title="Avg Per Student" value={formatRs(filtered.length ? Math.round(totalDue/filtered.length) : 0)} icon="students" color="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={classFilter} onChange={e => setClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          {['All','strict','grace','first'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {s === 'All' ? 'All Status' : STATUS_META[s].icon + ' ' + s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 border-b border-red-100">
                {['#','Student','Class','Father Cell','Unpaid Months','Amount Due','Status','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><Empty icon="check" title="No defaulters!" sub="All students have paid their fees." /></td></tr>
                : filtered.map((d, i) => {
                  const meta = STATUS_META[d.status]
                  return (
                    <tr key={d.id} className="table-row border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">{d.name[0]}</div>
                          <div>
                            <div className="font-semibold text-slate-800">{d.name}</div>
                            <div className="text-xs text-slate-400">S/O {d.father}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge color="blue">{d.class}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{d.fatherCell}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {d.unpaidMonths.map(m => <Badge key={m} color="red" className="text-[10px]">{m}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono-num text-red-600">{formatRs(d.totalDue)}</td>
                      <td className="px-4 py-3"><Badge color={meta.color}>{meta.icon} {d.status.toUpperCase()}</Badge></td>
                      <td className="px-4 py-3">
                        <Btn onClick={() => sendWA(d)} variant="whatsapp" size="sm" icon="whatsapp" disabled={sending === d.id}>
                          {sending === d.id ? 'Opening…' : 'WhatsApp'}
                        </Btn>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reminder schedule info */}
      <Card className="bg-blue-50 border-blue-100">
        <div className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Icon name="bell" size={16} />Smart Reminder Schedule</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['5th','Gentle Reminder','bg-green-100 text-green-700'],['10th','Firm Notice','bg-amber-100 text-amber-700'],['15th','Warning','bg-orange-100 text-orange-700'],['20th','Final Notice','bg-red-100 text-red-700']].map(([d,l,c]) => (
            <div key={d} className={`rounded-xl px-3 py-2 text-center ${c}`}>
              <div className="font-bold text-lg font-mono-num">{d}</div>
              <div className="text-xs font-medium">{l}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-3">WhatsApp reminders are sent via wa.me links. Click the button next to each student or use Bulk WhatsApp to open all at once.</p>
      </Card>
    </div>
  )
}
