import React, { useState } from 'react'
import { Card, Btn, Input, Select, Badge, Icon, Modal, PageHeader, Empty } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { CLASSES, formatDate, buildWhatsAppLink, admissionMsg } from '../../utils/helpers'

const DEMO_STUDENTS = [
  { id: 1, name: 'Ahmed Raza', father: 'Muhammad Raza', admission: 'KS-2024-001', family: 'FAM-001', kinship: 'Son', fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd', class: 'Class 5', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
  { id: 2, name: 'Sara Malik', father: 'Tariq Malik', admission: 'KS-2024-002', family: 'FAM-002', kinship: 'Daughter', fatherCell: '0311-2345678', motherCell: '0312-2345678', address: 'House 45, Kins St', class: 'Class 3', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-01' },
  { id: 3, name: 'Usman Ali', father: 'Khalid Ali', admission: 'KS-2024-003', family: 'FAM-003', kinship: 'Son', fatherCell: '0322-3456789', motherCell: '', address: 'House 78, Main Bazar', class: 'Class 7', paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-01-20' },
  { id: 4, name: 'Fatima Khan', father: 'Imran Khan', admission: 'KS-2024-004', family: 'FAM-004', kinship: 'Daughter', fatherCell: '0333-4567890', motherCell: '0334-4567890', address: 'House 90, Garden Town', class: 'Class 8', paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-03-10' },
  { id: 5, name: 'Bilal Hassan', father: 'Asif Hassan', admission: 'KS-2024-005', family: 'FAM-001', kinship: 'Son', fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd', class: 'Class 6', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
  { id: 6, name: 'Zainab Iqbal', father: 'Naveed Iqbal', admission: 'KS-2024-006', family: 'FAM-005', kinship: 'Daughter', fatherCell: '0344-5678901', motherCell: '0345-5678901', address: 'House 23, Satellite Town', class: 'Class 4', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-15' },
  { id: 7, name: 'Ali Hassan', father: 'Noman Hassan', admission: 'KS-2024-007', family: 'FAM-006', kinship: 'Son', fatherCell: '0355-6789012', motherCell: '', address: 'House 56, Civil Lines', class: 'Class 9', paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-10' },
  { id: 8, name: 'Hina Shah', father: 'Waqas Shah', admission: 'KS-2024-008', family: 'FAM-007', kinship: 'Daughter', fatherCell: '0366-7890123', motherCell: '0367-7890123', address: 'House 89, Officers Colony', class: 'Class 10', paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-12' },
]

const EMPTY_STUDENT = { name: '', father: '', admission: '', family: '', kinship: 'Son', fatherCell: '', motherCell: '', address: '', class: 'Class 1', paperFund: 2000, monthlyFee: 1500, admissionDate: '' }

export default function StudentsPage({ toast }) {
  const { students: storeStudents, addStudent, updateStudent, deleteStudent } = useAppStore()
  const allStudents = storeStudents.length ? storeStudents : DEMO_STUDENTS

  const [query, setQuery]         = useState('')
  const [classFilter, setClass]   = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editStudent, setEdit]    = useState(null)
  const [form, setForm]           = useState(EMPTY_STUDENT)
  const [delConfirm, setDelConf]  = useState(null)

  const filtered = allStudents.filter(s => {
    const q = query.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.admission.toLowerCase().includes(q) || s.fatherCell.includes(q)
    const matchC = classFilter === 'All' || s.class === classFilter
    return matchQ && matchC
  })

  const openAdd = () => { setEdit(null); setForm(EMPTY_STUDENT); setModalOpen(true) }
  const openEdit = (s) => { setEdit(s); setForm({ ...s }); setModalOpen(true) }

  const handleSave = () => {
    if (!form.name || !form.father || !form.admission) { toast('Name, Father and Admission# are required.', 'error'); return }
    if (editStudent) {
      updateStudent(editStudent.id, form)
      toast('Student updated!', 'success')
    } else {
      addStudent({ ...form, id: Date.now() })
      toast('Student added!', 'success')
    }
    setModalOpen(false)
  }

  const handleDelete = (s) => { setDelConf(s) }
  const confirmDelete = () => { deleteStudent(delConfirm.id); toast('Student deleted.', 'warn'); setDelConf(null) }

  const set = (field) => (value) => setForm(p => ({ ...p, [field]: value }))

  const sendWA = (s) => {
    const msg = admissionMsg(s)
    window.open(buildWhatsAppLink(s.fatherCell, msg), '_blank')
  }

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title={`Students (${allStudents.length})`} sub="Manage all enrolled students">
        <Btn onClick={openAdd} variant="primary" icon="plus">Add Student</Btn>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={16} /></span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, admission#, cell…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <select value={classFilter} onChange={e => setClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Admission#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Father Cell</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Fee</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12"><Empty icon="students" title="No students found" /></td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="table-row border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-400 font-mono-num text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{s.name[0]}</div>
                        <div>
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-400">S/O {s.father}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge color="blue">{s.class}</Badge></td>
                    <td className="px-4 py-3 font-mono-num text-xs text-slate-600">{s.admission}</td>
                    <td className="px-4 py-3 text-slate-600">{s.fatherCell}</td>
                    <td className="px-4 py-3 font-mono-num font-semibold text-emerald-700">Rs.{s.monthlyFee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(s.admissionDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Icon name="edit" size={15} /></button>
                        <button onClick={() => sendWA(s)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp"><Icon name="whatsapp" size={15} /></button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Icon name="trash" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Edit Student' : 'Add New Student'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Name" value={form.name} onChange={set('name')} placeholder="Full name" required />
          <Input label="Father Name" value={form.father} onChange={set('father')} placeholder="Father's full name" required />
          <Input label="Admission Number" value={form.admission} onChange={set('admission')} placeholder="KS-2024-XXX" required />
          <Input label="Family Number" value={form.family} onChange={set('family')} placeholder="FAM-XXX" />
          <Select label="Kinship" value={form.kinship} onChange={set('kinship')} options={['Son','Daughter','Other']} />
          <Input label="Father Cell" value={form.fatherCell} onChange={set('fatherCell')} placeholder="03XX-XXXXXXX" type="tel" />
          <Input label="Mother Cell" value={form.motherCell} onChange={set('motherCell')} placeholder="03XX-XXXXXXX" type="tel" />
          <Select label="Class" value={form.class} onChange={set('class')} options={CLASSES} />
          <Input label="Agreed Monthly Fee (Rs)" value={form.monthlyFee} onChange={set('monthlyFee')} type="number" />
          <Input label="Agreed Paper Fund (Rs)" value={form.paperFund} onChange={set('paperFund')} type="number" />
          <Input label="Admission Date" value={form.admissionDate} onChange={set('admissionDate')} type="date" />
          <Input label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Btn onClick={() => setModalOpen(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" icon="save">{editStudent ? 'Update Student' : 'Save Student'}</Btn>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConf(null)} title="Delete Student" size="sm">
        <p className="text-sm text-slate-600">Are you sure you want to delete <strong>{delConfirm?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3 mt-5 justify-end">
          <Btn onClick={() => setDelConf(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirmDelete} variant="danger" icon="trash">Delete</Btn>
        </div>
      </Modal>
    </div>
  )
}
