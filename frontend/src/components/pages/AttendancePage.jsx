import React, { useState } from 'react'
import { Card, Btn, Badge, Icon, PageHeader, StatCard, Empty } from '../common/UI'
import { buildWhatsAppLink, CLASSES } from '../../utils/helpers'

const DEMO_STUDENTS = [
  { id: 1, name: 'Ahmed Raza',   class: 'Class 5', fatherCell: '0300-1234567' },
  { id: 2, name: 'Sara Malik',   class: 'Class 3', fatherCell: '0311-2345678' },
  { id: 3, name: 'Usman Ali',    class: 'Class 7', fatherCell: '0322-3456789' },
  { id: 4, name: 'Fatima Khan',  class: 'Class 8', fatherCell: '0333-4567890' },
  { id: 5, name: 'Bilal Hassan', class: 'Class 6', fatherCell: '0300-1234567' },
  { id: 6, name: 'Zainab Iqbal', class: 'Class 4', fatherCell: '0344-5678901' },
  { id: 7, name: 'Ali Hassan',   class: 'Class 9', fatherCell: '0355-6789012' },
  { id: 8, name: 'Hina Shah',    class: 'Class 10', fatherCell: '0366-7890123' },
]

const STATUS_OPTS = ['present', 'absent', 'leave']
const STATUS_META = {
  present: { label: 'P', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  absent:  { label: 'A', color: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50 border-red-300'     },
  leave:   { label: 'L', color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-300' },
}

const absentMsg = (student, date) =>
  `Assalam-o-Alaikum,\n\nDear Parent of *${student.name}*,\n\nThis is to inform you that your child was *absent* from school today (${date}).\n\nKindly ensure regular attendance.\n\nRegards,\n*KINS SCHOOL*\nRatta Rd, Kins St, Gujranwala`

export default function AttendancePage({ toast }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate]             = useState(today)
  const [classFilter, setClass]     = useState('All')
  const [attendance, setAttendance] = useState({})

  const filtered = DEMO_STUDENTS.filter(s => classFilter === 'All' || s.class === classFilter)

  const mark = (studentId, status) => {
    setAttendance(p => ({ ...p, [`${date}-${studentId}`]: status }))
  }

  const markAll = (status) => {
    const updates = {}
    filtered.forEach(s => { updates[`${date}-${s.id}`] = status })
    setAttendance(p => ({ ...p, ...updates }))
  }

  const getStatus = (studentId) => attendance[`${date}-${studentId}`] || null

  const presentCount = filtered.filter(s => getStatus(s.id) === 'present').length
  const absentCount  = filtered.filter(s => getStatus(s.id) === 'absent').length
  const leaveCount   = filtered.filter(s => getStatus(s.id) === 'leave').length
  const unmarked     = filtered.filter(s => !getStatus(s.id)).length

  const saveAttendance = () => {
    toast(`Attendance saved for ${filtered.length} students!`, 'success')
  }

  const notifyAbsent = () => {
    const absentStudents = filtered.filter(s => getStatus(s.id) === 'absent')
    if (!absentStudents.length) { toast('No absent students to notify.', 'warn'); return }
    const displayDate = new Date(date).toLocaleDateString('en-GB')
    absentStudents.forEach((s, i) => {
      setTimeout(() => {
        const msg = absentMsg(s, displayDate)
        window.open(buildWhatsAppLink(s.fatherCell, msg), '_blank')
      }, i * 600)
    })
    toast(`WhatsApp opened for ${absentStudents.length} absent students.`, 'success')
  }

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Daily Attendance" sub="Mark and track student attendance">
        <Btn onClick={saveAttendance} variant="primary" icon="save">Save Attendance</Btn>
      </PageHeader>

      {/* Date + class filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={16} className="text-slate-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white font-mono-num" />
        </div>
        <select value={classFilter} onChange={e => setClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <Btn onClick={() => markAll('present')} variant="success" size="sm">Mark All Present</Btn>
          <Btn onClick={notifyAbsent} variant="whatsapp" size="sm" icon="whatsapp">Notify Absent ({absentCount})</Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present" value={presentCount.toString()} icon="check" color="green" sub={`${filtered.length ? Math.round((presentCount/filtered.length)*100) : 0}% attendance`} />
        <StatCard title="Absent" value={absentCount.toString()} icon="close" color="red" sub="Notified via WhatsApp" />
        <StatCard title="On Leave" value={leaveCount.toString()} icon="calendar" color="amber" />
        <StatCard title="Unmarked" value={unmarked.toString()} icon="alert" color={unmarked > 0 ? 'amber' : 'blue'} />
      </div>

      {/* Attendance table */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900">
            Attendance — {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Leave</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Mark Attendance</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6}><Empty icon="attendance" title="No students found" /></td></tr>
                : filtered.map((s, i) => {
                  const status = getStatus(s.id)
                  const meta = status ? STATUS_META[status] : null
                  return (
                    <tr key={s.id} className="table-row border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${meta ? `${meta.color} text-white` : 'bg-slate-100 text-slate-600'}`}>
                            {status ? STATUS_META[status].label : s.name[0]}
                          </div>
                          <span className="font-semibold text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge color="blue">{s.class}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {STATUS_OPTS.map(opt => (
                            <button key={opt} onClick={() => mark(s.id, opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all capitalize ${status === opt ? `${STATUS_META[opt].bg} ${STATUS_META[opt].text} border-current` : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status
                          ? <Badge color={status === 'present' ? 'green' : status === 'absent' ? 'red' : 'amber'}>{status.toUpperCase()}</Badge>
                          : <Badge color="gray">—</Badge>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status === 'absent' && (
                          <button onClick={() => { window.open(buildWhatsAppLink(s.fatherCell, absentMsg(s, new Date(date).toLocaleDateString('en-GB'))), '_blank'); toast(`WhatsApp opened for ${s.name}`, 'success') }}
                            className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                            <Icon name="whatsapp" size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
          <span className="text-emerald-700 font-semibold">✓ Present: {presentCount}</span>
          <span className="text-red-600 font-semibold">✗ Absent: {absentCount}</span>
          <span className="text-amber-700 font-semibold">◎ Leave: {leaveCount}</span>
          <span className="text-slate-500">Total: {filtered.length}</span>
          <span className="ml-auto font-bold text-blue-700">
            {filtered.length ? Math.round((presentCount / filtered.length) * 100) : 0}% Attendance Rate
          </span>
        </div>
      </Card>
    </div>
  )
}
