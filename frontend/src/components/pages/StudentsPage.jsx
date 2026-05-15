import React, { useState } from 'react'
import { Card, Btn, Input, Select, Badge, Icon, Modal, PageHeader, Empty } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { CLASSES, formatDate, buildWhatsAppLink, admissionMsg } from '../../utils/helpers'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const DEMO_STUDENTS = [
  { id: 1,  name: 'Ahmed Raza',   father: 'Muhammad Raza', admission: 'KS-2024-001', family: 'FAM-001', kinship: 'Son',      fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd',       class: 'Class 5',  paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
  { id: 2,  name: 'Sara Malik',   father: 'Tariq Malik',   admission: 'KS-2024-002', family: 'FAM-002', kinship: 'Daughter', fatherCell: '0311-2345678', motherCell: '0312-2345678', address: 'House 45, Kins St',        class: 'Class 3',  paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-01' },
  { id: 3,  name: 'Usman Ali',    father: 'Khalid Ali',    admission: 'KS-2024-003', family: 'FAM-003', kinship: 'Son',      fatherCell: '0322-3456789', motherCell: '',             address: 'House 78, Main Bazar',     class: 'Class 7',  paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-01-20' },
  { id: 4,  name: 'Fatima Khan',  father: 'Imran Khan',    admission: 'KS-2024-004', family: 'FAM-004', kinship: 'Daughter', fatherCell: '0333-4567890', motherCell: '0334-4567890', address: 'House 90, Garden Town',    class: 'Class 8',  paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-03-10' },
  { id: 5,  name: 'Bilal Hassan', father: 'Asif Hassan',   admission: 'KS-2024-005', family: 'FAM-001', kinship: 'Son',      fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd',       class: 'Class 6',  paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
  { id: 6,  name: 'Zainab Iqbal', father: 'Naveed Iqbal',  admission: 'KS-2024-006', family: 'FAM-005', kinship: 'Daughter', fatherCell: '0344-5678901', motherCell: '0345-5678901', address: 'House 23, Satellite Town', class: 'Class 4',  paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-15' },
  { id: 7,  name: 'Ali Hassan',   father: 'Noman Hassan',  admission: 'KS-2024-007', family: 'FAM-006', kinship: 'Son',      fatherCell: '0355-6789012', motherCell: '',             address: 'House 56, Civil Lines',    class: 'Class 9',  paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-10' },
  { id: 8,  name: 'Hina Shah',    father: 'Waqas Shah',    admission: 'KS-2024-008', family: 'FAM-007', kinship: 'Daughter', fatherCell: '0366-7890123', motherCell: '0367-7890123', address: 'House 89, Officers Colony', class: 'Class 10', paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-12' },
]

const EMPTY_FORM = {
  name: '', father: '', admission: '', family: '', kinship: 'Son',
  fatherCell: '', motherCell: '', address: '',
  class: 'Class 1', paperFund: 2000, monthlyFee: 1500, admissionDate: ''
}

const saveToSheets = async (token, student, action = 'insert') => {
  if (!API_URL || !token || token === 'demo-token-offline') return
  try {
    if (action === 'insert') {
      await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(student),
      })
    } else if (action === 'update') {
      await fetch(`${API_URL}/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(student),
      })
    } else if (action === 'delete') {
      await fetch(`${API_URL}/api/students/${student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  } catch { /* offline — local only */ }
}

export default function StudentsPage({ toast }) {
  const { students: storeStudents, addStudent, updateStudent, deleteStudent, token } = useAppStore()
  const allStudents = storeStudents.length ? storeStudents : DEMO_STUDENTS

  const [query, setQuery]         = useState('')
  const [classFilter, setClass]   = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editStudent, setEdit]    = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [delConfirm, setDelConf]  = useState(null)
  const [saving, setSaving]       = useState(false)

  const filtered = allStudents.filter(s => {
    const q = query.toLowerCase()
    const matchQ = !q ||
      s.name.toLowerCase().includes(q) ||
      s.admission.toLowerCase().includes(q) ||
      s.fatherCell.includes(q) ||
      s.family.toLowerCase().includes(q)
    const matchC = classFilter === 'All' || s.class === classFilter
    return matchQ && matchC
  })

  const openAdd  = () => { setEdit(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (s) => { setEdit(s); setForm({ ...s }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name || !form.father || !form.admission) {
      toast('Name, Father and Admission# are required.', 'error'); return
    }
    setSaving(true)
    try {
      if (editStudent) {
        const updated = { ...editStudent, ...form }
        updateStudent(editStudent.id, form)
        await saveToSheets(token, updated, 'update')
        toast('Student updated!', 'success')
      } else {
        const newStudent = { ...form, id: Date.now() }
        addStudent(newStudent)
        await saveToSheets(token, newStudent, 'insert')
        toast('Student added!', 'success')
      }
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    await saveToSheets(token, delConfirm, 'delete')
    deleteStudent(delConfirm.id)
    toast('Student deleted.', 'warn')
    setDelConf(null)
  }

  const sendWA = (s) => {
    const msg = admissionMsg(s)
    window.open(buildWhatsAppLink(s.fatherCell, msg), '_blank')
  }

  const set = (field) => (value) => setForm(p => ({ ...p, [field]: value }))

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title={`Students (${allStudents.length})`} sub="Manage all enrolled students">
        <Btn onClick={openAdd} variant="primary" icon="plus">Add Student</Btn>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={16} />
          </span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, admission#, cell, family#…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
        </div>
        <select value={classFilter} onChange={e => setClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CLASSES].map(c => {
          const count = c === 'All'
            ? allStudents.length
            : allStudents.filter(s => s.class === c).length
          if (count === 0 && c !== 'All') return null
          return (
            <button key={c} onClick={() => setClass(c)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${classFilter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {c} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['#','Student','Class','Admission#','Family#','Father Cell','Monthly Fee','Joined','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12">
                  <Empty icon="students" title="No students found" sub="Try a different search or add a new student" />
                </td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className="table-row border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-400">S/O {s.father}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge color="blue">{s.class}</Badge></td>
                  <td className="px-4 py-3 font-mono-num text-xs text-slate-600">{s.admission}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.family || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.fatherCell}</td>
                  <td className="px-4 py-3 font-mono-num font-semibold text-emerald-700">
                    Rs. {Number(s.monthlyFee || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(s.admissionDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Icon name="edit" size={15} />
                      </button>
                      <button onClick={() => sendWA(s)}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                        <Icon name="whatsapp" size={15} />
                      </button>
                      <button onClick={() => setDelConf(s)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={6} className="px-4 py-2 text-xs text-slate-500 font-semibold">
                    Showing {filtered.length} of {allStudents.length} students
                  </td>
                  <td className="px-4 py-2 text-xs font-bold text-emerald-700">
                    Avg: Rs. {allStudents.length
                      ? Math.round(allStudents.reduce((a, s) => a + Number(s.monthlyFee || 0), 0) / allStudents.length).toLocaleString()
                      : 0}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editStudent ? `Edit — ${editStudent.name}` : 'Add New Student'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Name"      value={form.name}          onChange={set('name')}         placeholder="Full name"         required />
          <Input label="Father Name"       value={form.father}        onChange={set('father')}       placeholder="Father's full name" required />
          <Input label="Admission Number"  value={form.admission}     onChange={set('admission')}    placeholder="KS-2024-XXX"       required />
          <Input label="Family Number"     value={form.family}        onChange={set('family')}       placeholder="FAM-XXX" />
          <Select label="Kinship"          value={form.kinship}       onChange={set('kinship')}      options={['Son','Daughter','Other']} />
          <Select label="Class"            value={form.class}         onChange={set('class')}        options={CLASSES} required />
          <Input label="Father Cell"       value={form.fatherCell}    onChange={set('fatherCell')}   placeholder="03XX-XXXXXXX" type="tel" />
          <Input label="Mother Cell"       value={form.motherCell}    onChange={set('motherCell')}   placeholder="03XX-XXXXXXX" type="tel" />
          <Input label="Monthly Fee (Rs)"  value={form.monthlyFee}    onChange={set('monthlyFee')}   type="number" />
          <Input label="Paper Fund (Rs)"   value={form.paperFund}     onChange={set('paperFund')}    type="number" />
          <Input label="Admission Date"    value={form.admissionDate} onChange={set('admissionDate')} type="date" />
          <Input label="Address"           value={form.address}       onChange={set('address')}      placeholder="Full address" />
        </div>

        {/* Fee preview */}
        {(form.monthlyFee || form.paperFund) && (
          <div className="mt-4 flex gap-3 p-3 bg-blue-50 rounded-xl text-sm">
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500">Monthly Fee</div>
              <div className="font-bold font-mono-num text-blue-700">Rs. {Number(form.monthlyFee||0).toLocaleString()}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500">Annual Paper Fund</div>
              <div className="font-bold font-mono-num text-blue-700">Rs. {Number(form.paperFund||0).toLocaleString()}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500">Annual Total</div>
              <div className="font-bold font-mono-num text-emerald-700">
                Rs. {(Number(form.monthlyFee||0)*12 + Number(form.paperFund||0)).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6 justify-end">
          <Btn onClick={() => setModalOpen(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" icon="save" disabled={saving}>
            {saving ? 'Saving…' : editStudent ? 'Update Student' : 'Save Student'}
          </Btn>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConf(null)} title="Delete Student" size="sm">
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
            {delConfirm?.name[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{delConfirm?.name}</div>
            <div className="text-xs text-slate-500">{delConfirm?.class} • {delConfirm?.admission}</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete this student? This will also remove their data from Google Sheets and cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Btn onClick={() => setDelConf(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirmDelete} variant="danger" icon="trash">Delete Student</Btn>
        </div>
      </Modal>
    </div>
  )
}
