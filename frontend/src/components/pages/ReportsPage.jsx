import React, { useState } from 'react'
import { Card, Btn, Badge, Icon, PageHeader, StatCard } from '../common/UI'
import { formatRs, exportCSV, SCHOOL_MONTHS, CLASSES } from '../../utils/helpers'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const MONTHLY_REPORT = [
  { month: 'Feb', collected: 68000, target: 80000, pending: 12000 },
  { month: 'Mar', collected: 72000, target: 80000, pending: 8000  },
  { month: 'Apr', collected: 65000, target: 80000, pending: 15000 },
  { month: 'May', collected: 78000, target: 80000, pending: 2000  },
  { month: 'Jun', collected: 55000, target: 80000, pending: 25000 },
  { month: 'Jul', collected: 74000, target: 80000, pending: 6000  },
  { month: 'Aug', collected: 79000, target: 80000, pending: 1000  },
  { month: 'Sep', collected: 82000, target: 80000, pending: 0     },
  { month: 'Oct', collected: 76000, target: 80000, pending: 4000  },
  { month: 'Nov', collected: 85000, target: 80000, pending: 0     },
  { month: 'Dec', collected: 71000, target: 80000, pending: 9000  },
  { month: 'Jan', collected: 69000, target: 80000, pending: 11000 },
]

const CLASS_REPORT = [
  { class: 'PG',   students: 18, collected: 27000,  pending: 4500  },
  { class: 'Nur',  students: 22, collected: 33000,  pending: 6000  },
  { class: 'Prep', students: 25, collected: 37500,  pending: 7500  },
  { class: 'Cl.1', students: 28, collected: 42000,  pending: 0     },
  { class: 'Cl.2', students: 24, collected: 36000,  pending: 3000  },
  { class: 'Cl.3', students: 27, collected: 40500,  pending: 9000  },
  { class: 'Cl.4', students: 23, collected: 34500,  pending: 6900  },
  { class: 'Cl.5', students: 26, collected: 39000,  pending: 0     },
  { class: 'Cl.6', students: 21, collected: 42000,  pending: 10500 },
  { class: 'Cl.7', students: 19, collected: 38000,  pending: 8000  },
  { class: 'Cl.8', students: 20, collected: 40000,  pending: 4000  },
]

const PIE_DATA = [
  { name: 'Fully Paid',    value: 142, color: '#059669' },
  { name: 'Partial Paid',  value: 58,  color: '#D97706' },
  { name: 'Unpaid',        value: 47,  color: '#DC2626' },
]

const PAPER_FUND = [
  { class: 'Cl.5', agreed: 52000, collected: 48000 },
  { class: 'Cl.6', agreed: 42000, collected: 31500 },
  { class: 'Cl.7', agreed: 47500, collected: 42500 },
  { class: 'Cl.8', agreed: 50000, collected: 50000 },
  { class: 'Cl.9', agreed: 57000, collected: 45600 },
]

export default function ReportsPage({ toast }) {
  const [activeReport, setActiveReport] = useState('monthly')
  const [classFilter, setClassFilter]   = useState('All')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')

  const totalCollected = MONTHLY_REPORT.reduce((a, m) => a + m.collected, 0)
  const totalPending   = MONTHLY_REPORT.reduce((a, m) => a + m.pending, 0)
  const totalTarget    = MONTHLY_REPORT.reduce((a, m) => a + m.target, 0)
  const recoveryPct    = Math.round((totalCollected / totalTarget) * 100)

  const handleExportCSV = () => {
    if (activeReport === 'monthly') {
      exportCSV(MONTHLY_REPORT.map(m => ({ Month: m.month, Collected: m.collected, Target: m.target, Pending: m.pending })), 'Monthly-Fee-Report.csv')
    } else if (activeReport === 'class') {
      exportCSV(CLASS_REPORT.map(c => ({ Class: c.class, Students: c.students, Collected: c.collected, Pending: c.pending })), 'Class-Fee-Report.csv')
    }
    toast('CSV Exported!', 'success')
  }

  const handleExportPDF = async () => {
    const el = document.getElementById('report-content')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 1.5 })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
    pdf.save('KINS-SCHOOL-Report.pdf')
    toast('PDF Downloaded!', 'success')
  }

  const REPORTS = [
    { key: 'monthly',   label: 'Monthly Collection',  icon: 'fee'      },
    { key: 'class',     label: 'Class-wise Report',   icon: 'students' },
    { key: 'paperfund', label: 'Paper Fund',           icon: 'receipt'  },
    { key: 'status',    label: 'Payment Status',       icon: 'reports'  },
  ]

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Reports & Analytics" sub="Comprehensive fee and student reports">
        <Btn onClick={handleExportCSV} variant="ghost" icon="excel" size="sm">Export CSV</Btn>
        <Btn onClick={handleExportPDF} variant="ghost" icon="pdf" size="sm">Export PDF</Btn>
        <Btn onClick={() => window.print()} variant="ghost" icon="print" size="sm">Print</Btn>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value={`Rs.${(totalCollected/100000).toFixed(1)}L`} icon="fee" color="green" trend={8} />
        <StatCard title="Total Pending" value={`Rs.${(totalPending/1000).toFixed(0)}K`} icon="defaulter" color="amber" />
        <StatCard title="Recovery Rate" value={`${recoveryPct}%`} icon="reports" color="blue" trend={3} />
        <StatCard title="Total Students" value="247" icon="students" color="blue" />
      </div>

      {/* Report type selector */}
      <div className="flex flex-wrap gap-2">
        {REPORTS.map(r => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeReport === r.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
            <Icon name={r.icon} size={15} />{r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
        <span className="text-slate-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
        <Btn onClick={() => { setClassFilter('All'); setDateFrom(''); setDateTo('') }} variant="ghost" size="sm">Reset</Btn>
      </div>

      <div id="report-content" className="flex flex-col gap-6">
        {/* Monthly Collection */}
        {activeReport === 'monthly' && (
          <>
            <Card>
              <div className="font-bold text-slate-900 mb-1">Monthly Fee Collection vs Target</div>
              <div className="text-xs text-slate-500 mb-4">Academic Year Feb 2024 – Jan 2025</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={MONTHLY_REPORT} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip formatter={v => [`Rs. ${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="target"    name="Target"    fill="#E2E8F0" radius={[4,4,0,0]} barSize={14} />
                  <Bar dataKey="collected" name="Collected" fill="#1B4FD8" radius={[4,4,0,0]} barSize={14} />
                  <Bar dataKey="pending"   name="Pending"   fill="#FCA5A5" radius={[4,4,0,0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="font-bold text-slate-900 mb-4">Monthly Detail</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Month','Target','Collected','Pending','Recovery %'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_REPORT.map((m, i) => {
                      const pct = Math.round((m.collected / m.target) * 100)
                      return (
                        <tr key={i} className="table-row border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 font-semibold text-slate-800">{m.month}</td>
                          <td className="px-4 py-3 font-mono-num text-slate-600">{formatRs(m.target)}</td>
                          <td className="px-4 py-3 font-mono-num font-bold text-emerald-700">{formatRs(m.collected)}</td>
                          <td className="px-4 py-3 font-mono-num text-red-500">{formatRs(m.pending)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#059669' : pct >= 70 ? '#D97706' : '#DC2626' }} />
                              </div>
                              <span className="text-xs font-bold font-mono-num w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-4 py-3 font-bold text-blue-800">TOTAL</td>
                      <td className="px-4 py-3 font-bold font-mono-num">{formatRs(totalTarget)}</td>
                      <td className="px-4 py-3 font-bold font-mono-num text-emerald-700">{formatRs(totalCollected)}</td>
                      <td className="px-4 py-3 font-bold font-mono-num text-red-500">{formatRs(totalPending)}</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{recoveryPct}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Class-wise */}
        {activeReport === 'class' && (
          <>
            <Card>
              <div className="font-bold text-slate-900 mb-1">Class-wise Fee Collection</div>
              <div className="text-xs text-slate-500 mb-4">Current academic year</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={CLASS_REPORT} barGap={3}>
                  <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip formatter={v => [`Rs. ${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="#059669" radius={[4,4,0,0]} barSize={18} />
                  <Bar dataKey="pending"   name="Pending"   fill="#FCA5A5" radius={[4,4,0,0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Class','Students','Collected','Pending','Recovery'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CLASS_REPORT.map((c, i) => {
                      const total = c.collected + c.pending
                      const pct = total ? Math.round((c.collected / total) * 100) : 100
                      return (
                        <tr key={i} className="table-row border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3"><Badge color="blue">{c.class}</Badge></td>
                          <td className="px-4 py-3 font-mono-num text-slate-700">{c.students}</td>
                          <td className="px-4 py-3 font-mono-num font-bold text-emerald-700">{formatRs(c.collected)}</td>
                          <td className="px-4 py-3 font-mono-num text-red-500">{formatRs(c.pending)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#059669' : pct >= 70 ? '#D97706' : '#DC2626' }} />
                              </div>
                              <Badge color={pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'}>{pct}%</Badge>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Paper Fund */}
        {activeReport === 'paperfund' && (
          <>
            <Card>
              <div className="font-bold text-slate-900 mb-4">Annual Paper Fund Collection</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PAPER_FUND} barGap={4}>
                  <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={v => [`Rs. ${v.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="agreed"    name="Agreed"    fill="#BFDBFE" radius={[4,4,0,0]} barSize={22} />
                  <Bar dataKey="collected" name="Collected" fill="#1B4FD8" radius={[4,4,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Class','Agreed','Collected','Remaining','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAPER_FUND.map((p, i) => {
                    const rem = p.agreed - p.collected
                    const pct = Math.round((p.collected / p.agreed) * 100)
                    return (
                      <tr key={i} className="table-row border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3"><Badge color="blue">{p.class}</Badge></td>
                        <td className="px-4 py-3 font-mono-num">{formatRs(p.agreed)}</td>
                        <td className="px-4 py-3 font-mono-num font-bold text-emerald-700">{formatRs(p.collected)}</td>
                        <td className="px-4 py-3 font-mono-num text-red-500">{formatRs(rem)}</td>
                        <td className="px-4 py-3"><Badge color={pct === 100 ? 'green' : pct >= 70 ? 'amber' : 'red'}>{pct}%</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* Payment Status */}
        {activeReport === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="font-bold text-slate-900 mb-4">Payment Status Breakdown</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {PIE_DATA.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-bold font-mono-num">{d.value} students</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="font-bold text-slate-900 mb-4">Annual Summary</div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Total Students',    value: '247',           color: 'text-slate-900' },
                  { label: 'Fully Paid',         value: '142 (57.5%)',   color: 'text-emerald-700' },
                  { label: 'Partially Paid',     value: '58 (23.5%)',    color: 'text-amber-700' },
                  { label: 'Unpaid',             value: '47 (19.0%)',    color: 'text-red-600' },
                  { label: 'Total Target',       value: formatRs(totalTarget),    color: 'text-slate-700' },
                  { label: 'Total Collected',    value: formatRs(totalCollected), color: 'text-emerald-700' },
                  { label: 'Total Pending',      value: formatRs(totalPending),   color: 'text-red-600' },
                  { label: 'Overall Recovery',   value: `${recoveryPct}%`,        color: 'text-blue-700' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{r.label}</span>
                    <span className={`font-bold font-mono-num ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
