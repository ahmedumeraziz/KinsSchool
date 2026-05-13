import React from 'react'
import { StatCard, Card, Badge, Btn, Icon, PageHeader } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { formatRs, formatDate, isToday10th } from '../../utils/helpers'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const MONTHS_SHORT = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan']
const MONTHLY_DATA = [
  { m: 'Feb', collected: 68000, target: 80000 },
  { m: 'Mar', collected: 72000, target: 80000 },
  { m: 'Apr', collected: 65000, target: 80000 },
  { m: 'May', collected: 78000, target: 80000 },
  { m: 'Jun', collected: 81000, target: 80000 },
  { m: 'Jul', collected: 55000, target: 80000 },
  { m: 'Aug', collected: 74000, target: 80000 },
  { m: 'Sep', collected: 79000, target: 80000 },
  { m: 'Oct', collected: 82000, target: 80000 },
  { m: 'Nov', collected: 76000, target: 80000 },
  { m: 'Dec', collected: 85000, target: 80000 },
  { m: 'Jan', collected: 71000, target: 80000 },
]

export default function DashboardPage({ setPage }) {
  const { students, fees } = useAppStore()
  const allStudents = students.length || 8
  const defaulterList = [
    { name: 'Ahmed Raza',   class: 'Class 5', due: 3000, cell: '0300-1234567', months: 2 },
    { name: 'Sara Malik',   class: 'Class 3', due: 5950, cell: '0311-2345678', months: 3 },
    { name: 'Bilal Hassan', class: 'Class 6', due: 5000, cell: '0300-1234567', months: 3 },
    { name: 'Fatima Khan',  class: 'Class 8', due: 5500, cell: '0333-4567890', months: 2 },
    { name: 'Zainab Iqbal', class: 'Class 4', due: 750,  cell: '0344-5678901', months: 1 },
  ]
  const recentReceipts = [
    { no: 'KS-2024-001', student: 'Usman Ali',   amount: 2000, date: '2024-04-12' },
    { no: 'KS-2024-002', student: 'Zainab Iqbal', amount: 1500, date: '2024-04-20' },
    { no: 'KS-2024-003', student: 'Hina Shah',    amount: 2500, date: '2024-04-25' },
    { no: 'KS-2024-004', student: 'Ali Hassan',   amount: 2500, date: '2024-04-28' },
  ]
  const pieData = [
    { name: 'Paid', value: 168, color: '#059669' },
    { name: 'Unpaid', value: 79, color: '#FCA5A5' },
  ]
  const classData = [
    { cls: 'CL1', pct: 90 }, { cls: 'CL2', pct: 75 }, { cls: 'CL3', pct: 82 },
    { cls: 'CL4', pct: 68 }, { cls: 'CL5', pct: 91 }, { cls: 'CL6', pct: 55 },
    { cls: 'CL7', pct: 77 }, { cls: 'CL8', pct: 88 }, { cls: 'CL9', pct: 63 },
  ]

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Dashboard" sub={`Welcome back, Admin • ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`} />

      {/* 10th Alert */}
      {isToday10th() && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-pulse-anim">
          <span className="text-3xl">📋</span>
          <div className="flex-1">
            <div className="font-bold text-amber-800">Monthly Defaulter List Ready</div>
            <div className="text-sm text-amber-700 mt-0.5">Today is the 10th — {defaulterList.length} students have not paid this month's fee.</div>
          </div>
          <Btn onClick={() => setPage('defaulters')} variant="amber" size="sm">View Defaulters →</Btn>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={allStudents.toString()} icon="students" color="blue" trend={5} sub="Across all classes" />
        <StatCard title="Monthly Collection" value="Rs.74,500" icon="fee" color="green" trend={8} sub="May 2024" />
        <StatCard title="Pending Fees" value="Rs.1.2L" icon="defaulter" color="amber" sub="32 students pending" />
        <StatCard title="Today's Collection" value="Rs.8,200" icon="receipt" color="blue" sub="6 receipts today" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly line chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-slate-900">Monthly Fee Recovery</div>
              <div className="text-xs text-slate-500">Feb 2024 – Jan 2025</div>
            </div>
            <Badge color="green">68% Recovery</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA}>
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Line type="monotone" dataKey="target" stroke="#E2E8F0" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="collected" stroke="#1B4FD8" strokeWidth={2.5} dot={{ fill: '#1B4FD8', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart */}
        <Card>
          <div className="font-bold text-slate-900 mb-4">Fee Status</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-bold font-mono-num text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-500">Recovery Rate</div>
            <div className="text-2xl font-bold font-mono-num text-emerald-600">68%</div>
          </div>
        </Card>
      </div>

      {/* Class-wise bar chart + top defaulters + recent receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class-wise recovery */}
        <Card>
          <div className="font-bold text-slate-900 mb-4">Class-wise Recovery</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={classData} barSize={14}>
              <XAxis dataKey="cls" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Recovery']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {classData.map((e, i) => <Cell key={i} fill={e.pct >= 80 ? '#059669' : e.pct >= 60 ? '#D97706' : '#DC2626'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Defaulters */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-900">Top Defaulters</div>
            <button onClick={() => setPage('defaulters')} className="text-xs text-blue-600 font-semibold hover:underline">View All →</button>
          </div>
          <div className="flex flex-col gap-2">
            {defaulterList.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                  {d.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{d.name}</div>
                  <div className="text-xs text-slate-400">{d.class} • {d.months} month{d.months > 1 ? 's' : ''}</div>
                </div>
                <div className="text-sm font-bold font-mono-num text-red-600 shrink-0">{formatRs(d.due)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Receipts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-900">Recent Receipts</div>
            <button onClick={() => setPage('fee')} className="text-xs text-blue-600 font-semibold hover:underline">Fee Page →</button>
          </div>
          <div className="flex flex-col gap-2">
            {recentReceipts.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Icon name="receipt" size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{r.student}</div>
                  <div className="text-xs text-slate-400">{r.no} • {formatDate(r.date)}</div>
                </div>
                <div className="text-sm font-bold font-mono-num text-emerald-600 shrink-0">{formatRs(r.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
