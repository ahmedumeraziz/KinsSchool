import React, { useState } from 'react'
import { Card, Btn, Input, Badge, Icon, PageHeader, Empty } from '../common/UI'
import { buildWhatsAppLink, feeReminderMsg, defaulterMsg, admissionMsg, resultMsg, birthdayMsg, formatDate } from '../../utils/helpers'

const DEMO_STUDENTS = [
  { id: 1, name: 'Ahmed Raza',   father: 'Muhammad Raza', class: 'Class 5', fatherCell: '0300-1234567', monthlyFee: 1500 },
  { id: 2, name: 'Sara Malik',   father: 'Tariq Malik',   class: 'Class 3', fatherCell: '0311-2345678', monthlyFee: 1500 },
  { id: 3, name: 'Usman Ali',    father: 'Khalid Ali',    class: 'Class 7', fatherCell: '0322-3456789', monthlyFee: 2000 },
  { id: 4, name: 'Fatima Khan',  father: 'Imran Khan',    class: 'Class 8', fatherCell: '0333-4567890', monthlyFee: 2000 },
  { id: 5, name: 'Bilal Hassan', father: 'Asif Hassan',   class: 'Class 6', fatherCell: '0300-1234567', monthlyFee: 1500 },
]

const TEMPLATES = [
  {
    id: 'fee_reminder',
    label: 'Fee Reminder',
    icon: 'fee',
    color: 'blue',
    description: 'Send monthly fee reminder to parents',
    build: (s) => feeReminderMsg(s, s.monthlyFee, new Date().toLocaleString('default', { month: 'long' })),
  },
  {
    id: 'defaulter',
    label: 'Defaulter Notice',
    icon: 'defaulter',
    color: 'red',
    description: 'Send overdue fee notice with months list',
    build: (s) => defaulterMsg(s, ['March', 'April'], s.monthlyFee * 2),
  },
  {
    id: 'admission',
    label: 'Admission Welcome',
    icon: 'students',
    color: 'green',
    description: 'Welcome message for newly admitted students',
    build: (s) => admissionMsg(s),
  },
  {
    id: 'result',
    label: 'Result Sharing',
    icon: 'results',
    color: 'purple',
    description: 'Share exam result with percentage and grade',
    build: (s) => resultMsg(s, 87, 'A'),
  },
  {
    id: 'birthday',
    label: 'Birthday Wishes',
    icon: 'bell',
    color: 'amber',
    description: 'Send birthday greetings to students',
    build: (s) => birthdayMsg(s),
  },
  {
    id: 'custom',
    label: 'Custom Message',
    icon: 'whatsapp',
    color: 'green',
    description: 'Write your own custom message',
    build: () => '',
  },
]

const LOG = [
  { id: 1, student: 'Ahmed Raza',   type: 'Fee Reminder',   cell: '0300-1234567', date: '2024-04-10', status: 'sent' },
  { id: 2, student: 'Sara Malik',   type: 'Defaulter Notice', cell: '0311-2345678', date: '2024-04-10', status: 'sent' },
  { id: 3, student: 'Bilal Hassan', type: 'Fee Reminder',   cell: '0300-1234567', date: '2024-04-10', status: 'sent' },
  { id: 4, student: 'Fatima Khan',  type: 'Result Sharing', cell: '0333-4567890', date: '2024-04-08', status: 'sent' },
]

export default function WhatsAppPage({ toast }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedStudents, setSelectedStudents]  = useState([])
  const [customMsg, setCustomMsg]                = useState('')
  const [preview, setPreview]                    = useState('')
  const [previewStudent, setPreviewStudent]      = useState(null)
  const [sending, setSending]                    = useState(false)
  const [log, setLog]                            = useState(LOG)
  const [tab, setTab]                            = useState('compose')

  const toggleStudent = (s) => {
    setSelectedStudents(p =>
      p.find(x => x.id === s.id) ? p.filter(x => x.id !== s.id) : [...p, s]
    )
    if (!previewStudent) {
      setPreviewStudent(s)
      if (selectedTemplate) {
        const msg = selectedTemplate.id === 'custom' ? customMsg : selectedTemplate.build(s)
        setPreview(msg)
      }
    }
  }

  const selectTemplate = (t) => {
    setSelectedTemplate(t)
    if (previewStudent) {
      const msg = t.id === 'custom' ? customMsg : t.build(previewStudent)
      setPreview(msg)
    } else if (DEMO_STUDENTS[0]) {
      setPreviewStudent(DEMO_STUDENTS[0])
      const msg = t.id === 'custom' ? customMsg : t.build(DEMO_STUDENTS[0])
      setPreview(msg)
    }
  }

  const selectAll = () => {
    if (selectedStudents.length === DEMO_STUDENTS.length) setSelectedStudents([])
    else setSelectedStudents([...DEMO_STUDENTS])
  }

  const sendMessages = () => {
    if (!selectedTemplate) { toast('Please select a message template.', 'error'); return }
    if (selectedStudents.length === 0) { toast('Please select at least one student.', 'error'); return }
    setSending(true)
    selectedStudents.forEach((s, i) => {
      setTimeout(() => {
        const msg = selectedTemplate.id === 'custom' ? customMsg : selectedTemplate.build(s)
        window.open(buildWhatsAppLink(s.fatherCell, msg), '_blank')
        setLog(p => [{ id: Date.now() + i, student: s.name, type: selectedTemplate.label, cell: s.fatherCell, date: new Date().toLocaleDateString('en-GB'), status: 'sent' }, ...p])
        if (i === selectedStudents.length - 1) {
          setSending(false)
          toast(`WhatsApp opened for ${selectedStudents.length} student(s)!`, 'success')
        }
      }, i * 700)
    })
  }

  const sendSingle = (s) => {
    if (!selectedTemplate) { toast('Select a template first.', 'error'); return }
    const msg = selectedTemplate.id === 'custom' ? customMsg : selectedTemplate.build(s)
    window.open(buildWhatsAppLink(s.fatherCell, msg), '_blank')
    setLog(p => [{ id: Date.now(), student: s.name, type: selectedTemplate.label, cell: s.fatherCell, date: new Date().toLocaleDateString('en-GB'), status: 'sent' }, ...p])
    toast(`WhatsApp opened for ${s.name}`, 'success')
  }

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="WhatsApp Messages" sub="Send fee reminders, notices and announcements via WhatsApp">
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <Icon name="whatsapp" size={16} />wa.me Link Integration
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['compose','Compose'],['log','Message Log']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === k ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}{k === 'log' && <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{log.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Templates + Students */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Templates */}
            <Card>
              <div className="font-bold text-slate-900 mb-4">1. Select Message Template</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATES.map(t => {
                  const colors = {
                    blue:   'border-blue-200 bg-blue-50 text-blue-700',
                    red:    'border-red-200 bg-red-50 text-red-700',
                    green:  'border-emerald-200 bg-emerald-50 text-emerald-700',
                    purple: 'border-purple-200 bg-purple-50 text-purple-700',
                    amber:  'border-amber-200 bg-amber-50 text-amber-700',
                  }
                  const active = selectedTemplate?.id === t.id
                  return (
                    <button key={t.id} onClick={() => selectTemplate(t)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${active ? `${colors[t.color]} ring-2 ring-offset-1 ring-blue-300` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${active ? '' : 'bg-slate-100 text-slate-500'} ${active ? colors[t.color] : ''}`}>
                        <Icon name={t.icon} size={16} />
                      </div>
                      <div className="font-semibold text-sm text-slate-800">{t.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>
                    </button>
                  )
                })}
              </div>

              {selectedTemplate?.id === 'custom' && (
                <div className="mt-4">
                  <Input label="Custom Message" value={customMsg}
                    onChange={v => { setCustomMsg(v); setPreview(v) }}
                    placeholder="Type your custom message here…" rows={4} />
                </div>
              )}
            </Card>

            {/* Student selector */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-slate-900">2. Select Recipients</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{selectedStudents.length} selected</span>
                  <Btn onClick={selectAll} variant="ghost" size="sm">{selectedStudents.length === DEMO_STUDENTS.length ? 'Deselect All' : 'Select All'}</Btn>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {DEMO_STUDENTS.map(s => {
                  const isSelected = !!selectedStudents.find(x => x.id === s.id)
                  return (
                    <div key={s.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      onClick={() => toggleStudent(s)}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {isSelected && <Icon name="check" size={12} className="text-white" />}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{s.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.class} • {s.fatherCell}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); sendSingle(s) }}
                        className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors shrink-0">
                        <Icon name="whatsapp" size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Btn onClick={sendMessages} variant="whatsapp" icon="whatsapp" disabled={sending || selectedStudents.length === 0}
                  className="w-full justify-center" size="lg">
                  {sending ? 'Opening WhatsApp…' : `Send to ${selectedStudents.length || 0} Student(s)`}
                </Btn>
              </div>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col gap-4">
            <Card>
              <div className="font-bold text-slate-900 mb-4">Message Preview</div>
              {preview ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Icon name="whatsapp" size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700">KINS SCHOOL</div>
                      <div className="text-xs text-slate-400">via WhatsApp</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm border border-emerald-100">
                    {preview}
                  </div>
                  <div className="text-right text-xs text-slate-400 mt-1">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ) : (
                <Empty icon="whatsapp" title="No preview" sub="Select a template and student to see preview" />
              )}
            </Card>

            {/* WA info */}
            <Card className="bg-emerald-50 border-emerald-100">
              <div className="font-bold text-emerald-800 mb-2 text-sm flex items-center gap-2"><Icon name="alert" size={15} />How it works</div>
              <ul className="text-xs text-emerald-700 space-y-1.5">
                <li>• Clicking Send opens WhatsApp Web/App</li>
                <li>• Message is pre-filled, you just hit Send</li>
                <li>• Works on mobile & desktop</li>
                <li>• No API key or subscription needed</li>
                <li>• Bulk send opens one tab per student</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Log tab */}
      {tab === 'log' && (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['#','Student','Message Type','Cell Number','Date','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.length === 0
                  ? <tr><td colSpan={6}><Empty icon="whatsapp" title="No messages sent yet" /></td></tr>
                  : log.map((l, i) => (
                    <tr key={l.id} className="table-row border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{l.student}</td>
                      <td className="px-4 py-3"><Badge color="blue">{l.type}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{l.cell}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{l.date}</td>
                      <td className="px-4 py-3"><Badge color="green">✓ {l.status}</Badge></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
