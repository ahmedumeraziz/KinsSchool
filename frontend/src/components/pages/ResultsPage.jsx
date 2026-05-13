import React, { useState, useRef } from 'react'
import { Card, Btn, Input, Select, Badge, Icon, Modal, PageHeader, Empty, Divider } from '../common/UI'
import { getGrade, formatRs, buildWhatsAppLink, resultMsg, CLASSES } from '../../utils/helpers'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const EXAMS = ['Monthly Test','Mid-Term Exam','Final Exam','Annual Exam']
const DEFAULT_SUBJECTS = ['Mathematics','English','Science','Urdu','Islamiat','Social Studies','Computer','Pak Studies']

const DEMO_STUDENTS = [
  { id: 1, name: 'Ahmed Raza',   father: 'Muhammad Raza', class: 'Class 5', fatherCell: '0300-1234567' },
  { id: 2, name: 'Sara Malik',   father: 'Tariq Malik',   class: 'Class 3', fatherCell: '0311-2345678' },
  { id: 3, name: 'Usman Ali',    father: 'Khalid Ali',    class: 'Class 7', fatherCell: '0322-3456789' },
  { id: 4, name: 'Fatima Khan',  father: 'Imran Khan',    class: 'Class 8', fatherCell: '0333-4567890' },
]

const DEMO_RESULTS = [
  { id: 1, studentId: 1, exam: 'Mid-Term Exam', year: 2024, class: 'Class 5', subjects: [
    { name: 'Mathematics', max: 100, obtained: 87 }, { name: 'English', max: 100, obtained: 92 },
    { name: 'Science', max: 100, obtained: 78 },     { name: 'Urdu', max: 100, obtained: 85 },
    { name: 'Islamiat', max: 50, obtained: 44 },
  ], remarks: 'Excellent performance. Keep it up!' },
  { id: 2, studentId: 2, exam: 'Mid-Term Exam', year: 2024, class: 'Class 3', subjects: [
    { name: 'Mathematics', max: 100, obtained: 65 }, { name: 'English', max: 100, obtained: 72 },
    { name: 'Science', max: 100, obtained: 58 },     { name: 'Urdu', max: 100, obtained: 70 },
    { name: 'Islamiat', max: 50, obtained: 38 },
  ], remarks: 'Good effort. Focus on Science improvement.' },
]

const calcResult = (subjects) => {
  const totalMax = subjects.reduce((a, s) => a + s.max, 0)
  const totalObt = subjects.reduce((a, s) => a + s.obtained, 0)
  const pct = totalMax ? Math.round((totalObt / totalMax) * 100) : 0
  const { grade, label } = getGrade(pct)
  return { totalMax, totalObt, pct, grade, label, pass: pct >= 40 }
}

export default function ResultsPage({ toast }) {
  const [results, setResults]         = useState(DEMO_RESULTS)
  const [modalOpen, setModalOpen]     = useState(false)
  const [viewResult, setViewResult]   = useState(null)
  const [filterClass, setFilterClass] = useState('All')
  const [filterExam, setFilterExam]   = useState('All')
  const resultCardRef = useRef()

  // Form state
  const [form, setForm] = useState({
    studentId: '', exam: 'Mid-Term Exam', year: new Date().getFullYear(), class: 'Class 1',
    subjects: DEFAULT_SUBJECTS.slice(0, 5).map(n => ({ name: n, max: 100, obtained: '' })),
    remarks: ''
  })

  const openAdd = () => {
    setForm({ studentId: '', exam: 'Mid-Term Exam', year: new Date().getFullYear(), class: 'Class 1',
      subjects: DEFAULT_SUBJECTS.slice(0, 5).map(n => ({ name: n, max: 100, obtained: '' })), remarks: '' })
    setModalOpen(true)
  }

  const addSubject = () => setForm(p => ({ ...p, subjects: [...p.subjects, { name: '', max: 100, obtained: '' }] }))
  const removeSubject = (i) => setForm(p => ({ ...p, subjects: p.subjects.filter((_, idx) => idx !== i) }))
  const updateSubject = (i, field, val) => setForm(p => {
    const subs = [...p.subjects]; subs[i] = { ...subs[i], [field]: val }; return { ...p, subjects: subs }
  })

  const saveResult = () => {
    if (!form.studentId) { toast('Please select a student.', 'error'); return }
    const student = DEMO_STUDENTS.find(s => s.id === Number(form.studentId))
    setResults(p => [...p, { ...form, id: Date.now(), studentId: Number(form.studentId), student }])
    toast('Result saved!', 'success')
    setModalOpen(false)
  }

  const getStudent = (id) => DEMO_STUDENTS.find(s => s.id === id) || {}

  const filtered = results.filter(r => {
    const s = getStudent(r.studentId)
    const mc = filterClass === 'All' || (s.class || r.class) === filterClass
    const me = filterExam === 'All' || r.exam === filterExam
    return mc && me
  })

  const handlePDF = async () => {
    const canvas = await html2canvas(resultCardRef.current, { scale: 2 })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
    pdf.save(`Result-${viewResult?.id}.pdf`)
    toast('Result PDF downloaded!', 'success')
  }

  const handleWA = (r) => {
    const student = getStudent(r.studentId)
    const res = calcResult(r.subjects)
    const msg = resultMsg(student, res.pct, res.grade)
    window.open(buildWhatsAppLink(student.fatherCell, msg), '_blank')
  }

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Result Management" sub="Add and view student results with auto grade calculation">
        <Btn onClick={openAdd} variant="primary" icon="plus">Add Result</Btn>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterExam} onChange={e => setFilterExam(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Exams</option>
          {EXAMS.map(e => <option key={e}>{e}</option>)}
        </select>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? <Empty icon="results" title="No results found" sub="Add a result using the button above" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(r => {
            const student = getStudent(r.studentId)
            const res = calcResult(r.subjects)
            const gradeColor = res.pct >= 80 ? 'green' : res.pct >= 60 ? 'blue' : res.pct >= 40 ? 'amber' : 'red'
            return (
              <Card key={r.id} className="card-hover !p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{student.name || 'Student'}</div>
                    <div className="text-xs text-slate-500">{student.class || r.class}</div>
                  </div>
                  <Badge color={gradeColor}>{res.grade}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-3">{r.exam} • {r.year}</div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400">Percentage</div>
                    <div className="text-3xl font-bold font-mono-num" style={{ color: res.pct >= 60 ? '#059669' : '#DC2626' }}>{res.pct}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="font-bold font-mono-num text-slate-800">{res.totalObt}/{res.totalMax}</div>
                    <Badge color={res.pass ? 'green' : 'red'} className="mt-1">{res.pass ? 'PASS' : 'FAIL'}</Badge>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${res.pct}%`, background: res.pct >= 80 ? '#059669' : res.pct >= 60 ? '#1B4FD8' : res.pct >= 40 ? '#D97706' : '#DC2626' }} />
                </div>
                <div className="text-xs text-slate-400 mb-3">{res.label} • {r.subjects.length} subjects</div>
                <div className="flex gap-2">
                  <Btn onClick={() => setViewResult(r)} variant="ghost" size="sm" icon="eye" className="flex-1 justify-center">View</Btn>
                  <Btn onClick={() => handleWA(r)} variant="whatsapp" size="sm" icon="whatsapp">WA</Btn>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Result Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Student Result" size="lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</label>
            <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
              <option value="">Select student…</option>
              {DEMO_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.class}</option>)}
            </select>
          </div>
          <Select label="Exam Type" value={form.exam} onChange={v => setForm(p => ({ ...p, exam: v }))} options={EXAMS} />
          <Select label="Class" value={form.class} onChange={v => setForm(p => ({ ...p, class: v }))} options={CLASSES} />
          <Input label="Year" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} type="number" />
        </div>

        <Divider label="Subjects & Marks" />

        <div className="flex flex-col gap-2 mb-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
            <span className="col-span-5">Subject</span><span className="col-span-3">Max Marks</span><span className="col-span-3">Obtained</span><span className="col-span-1"></span>
          </div>
          {form.subjects.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} placeholder="Subject name"
                className="col-span-5 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              <input value={s.max} onChange={e => updateSubject(i, 'max', Number(e.target.value))} type="number"
                className="col-span-3 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              <input value={s.obtained} onChange={e => updateSubject(i, 'obtained', Number(e.target.value))} type="number" placeholder="0"
                className="col-span-3 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={() => removeSubject(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"><Icon name="trash" size={15} /></button>
            </div>
          ))}
          <Btn onClick={addSubject} variant="ghost" size="sm" icon="plus">Add Subject</Btn>
        </div>

        {/* Auto grade preview */}
        {form.subjects.some(s => s.obtained !== '') && (() => {
          const res = calcResult(form.subjects.map(s => ({ ...s, obtained: Number(s.obtained) || 0 })))
          return (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div><div className="text-xs text-slate-500">Percentage</div><div className="font-bold font-mono-num text-blue-700">{res.pct}%</div></div>
              <div><div className="text-xs text-slate-500">Grade</div><div className="font-bold text-blue-700">{res.grade}</div></div>
              <div><div className="text-xs text-slate-500">Status</div><Badge color={res.pass ? 'green' : 'red'}>{res.pass ? 'PASS' : 'FAIL'}</Badge></div>
            </div>
          )
        })()}

        <Input label="Teacher Remarks" value={form.remarks} onChange={v => setForm(p => ({ ...p, remarks: v }))} placeholder="Write remarks…" rows={2} />

        <div className="flex gap-3 mt-5 justify-end">
          <Btn onClick={() => setModalOpen(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveResult} variant="primary" icon="save">Save Result</Btn>
        </div>
      </Modal>

      {/* View Result Card Modal */}
      <Modal open={!!viewResult} onClose={() => setViewResult(null)} title="Result Card" size="lg">
        {viewResult && (() => {
          const student = getStudent(viewResult.studentId)
          const res = calcResult(viewResult.subjects)
          return (
            <>
              <div ref={resultCardRef} className="bg-white rounded-xl p-6">
                {/* Header */}
                <div className="text-center border-b-2 border-blue-700 pb-4 mb-5">
                  <div className="text-2xl font-display font-bold text-blue-800">🎓 KINS SCHOOL</div>
                  <div className="text-xs text-slate-500">Ratta Rd, Kins St, Gujranwala</div>
                  <div className="mt-2 font-bold text-slate-700">{viewResult.exam} — {viewResult.year}</div>
                </div>

                {/* Student info */}
                <div className="grid grid-cols-2 gap-2 mb-5 text-sm">
                  {[['Student Name', student.name],['Father Name', student.father],['Class', student.class || viewResult.class],['Admission#', student.admission || '—']].map(([l, v]) => (
                    <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-400">{l}</div>
                      <div className="font-semibold text-slate-800">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Marks table */}
                <table className="w-full text-sm border-collapse mb-5">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="px-3 py-2 text-left font-bold">Subject</th>
                      <th className="px-3 py-2 text-center font-bold">Max</th>
                      <th className="px-3 py-2 text-center font-bold">Obtained</th>
                      <th className="px-3 py-2 text-center font-bold">%</th>
                      <th className="px-3 py-2 text-center font-bold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewResult.subjects.map((s, i) => {
                      const subPct = Math.round((s.obtained / s.max) * 100)
                      const { grade } = getGrade(subPct)
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-3 py-2 font-medium">{s.name}</td>
                          <td className="px-3 py-2 text-center font-mono-num">{s.max}</td>
                          <td className="px-3 py-2 text-center font-mono-num font-bold">{s.obtained}</td>
                          <td className="px-3 py-2 text-center font-mono-num">{subPct}%</td>
                          <td className="px-3 py-2 text-center"><span className="font-bold">{grade}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-3 py-2 font-bold">TOTAL</td>
                      <td className="px-3 py-2 text-center font-bold font-mono-num">{res.totalMax}</td>
                      <td className="px-3 py-2 text-center font-bold font-mono-num">{res.totalObt}</td>
                      <td className="px-3 py-2 text-center font-bold font-mono-num text-blue-700">{res.pct}%</td>
                      <td className="px-3 py-2 text-center font-bold text-blue-700">{res.grade}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-4">
                  <div><span className="text-sm text-slate-500">Result: </span><Badge color={res.pass ? 'green' : 'red'} className="ml-1">{res.pass ? '✓ PASS' : '✗ FAIL'}</Badge></div>
                  <div><span className="text-sm text-slate-500">Grade: </span><span className="font-bold text-lg text-blue-700">{res.grade}</span></div>
                  <div><span className="text-sm text-slate-500">Status: </span><span className="font-semibold text-slate-700">{res.label}</span></div>
                </div>

                {viewResult.remarks && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                    <span className="font-bold text-amber-700">Teacher Remarks: </span>
                    <span className="text-amber-800">{viewResult.remarks}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4 no-print">
                <Btn onClick={() => window.print()} variant="ghost" icon="print">Print</Btn>
                <Btn onClick={handlePDF} variant="primary" icon="download">PDF</Btn>
                <Btn onClick={() => { handleWA(viewResult); }} variant="whatsapp" icon="whatsapp">WhatsApp</Btn>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
