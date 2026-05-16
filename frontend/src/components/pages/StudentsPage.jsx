import React, { useState, useEffect, useCallback } from 'react'
import { Card, Btn, Input, Select, Badge, Icon, Modal, PageHeader, Empty, Skeleton } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { CLASSES, formatDate, buildWhatsAppLink, admissionMsg } from '../../utils/helpers'
import { syncStudent, getQueueCount } from '../../utils/syncService'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const EMPTY_FORM = {
  name: '', father: '', admission: '', family: '', kinship: 'Son',
  fatherCell: '', motherCell: '', address: '',
  class: 'Class 1', paperFund: 2000, monthlyFee: 1500, admissionDate: ''
}

export default function StudentsPage({ toast }) {
  const { students: storeStudents, setStudents, addStudent, updateStudent, deleteStudent, token } = useAppStore()

  const [loading, setLoading]     = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [query, setQuery]         = useState('')
  const [classFilter, setClass]   = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editStudent, setEdit]    = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [delConfirm, setDelConf]  = useState(null)
  const [saving, setSaving]       = useState(false)
  const [source, setSource]       = useState('')

  // ── Fetch students from backend (which reads Google Sheets) ──
  const fetchStudents = useCallback(async (showLoader = true) => {
    if (!API_URL || !token || token === 'demo-token-offline') return
    if (showLoader) setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.students && data.students.length > 0) {
          setStudents(data.students)
          setSource(data.source || 'sheets')
        }
      }
    } catch {
      toast('Could not reach backend. Showing local data.', 'warn')
    } finally {
      setLoading(false)
    }
  }, [API_URL, token, setStudents, toast])

  // Fetch on mount
  useEffect(() => { fetchStudents() }, [fetchStudents])

  const handleSyncNow = async () => {
    setSyncing(true)
    await fetchStudents(false)
    toast('✅ Students synced from Google Sheets!', 'success')
    setSyncing(false)
  }

  const allStudents = storeStudents // No demo fallback — real data only

  const filtered = allStudents.filter(s => {
    const q = query.toLowerCase()
    const matchQ = !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.admission || '').toLowerCase().includes(q) ||
      (s.fatherCell || '').includes(q) ||
      (s.family || '').toLowerCase().includes(q)
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
        const result = await syncStudent(updated, 'update')
        if (result.ok) toast('✅ Student updated in Google Sheets!', 'success')
        else if (result.queued) toast('💾 Updated locally. Will sync when online.', 'warn')
      } else {
        const newStudent = { ...form, id: Date.now() }
        addStudent(newStudent)
        const result = await syncStudent(newStudent, 'create')
        if (result.ok) toast('✅ Student saved to Google Sheets!', 'success')
        else if (result.queued) toast('💾 Saved locally. Will sync when online.', 'warn')
        else toast('Student added locally.', 'info')
      }
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    const result = await syncStudent(delConfirm, 'delete')
    deleteStudent(delConfirm.id)
    if (result.ok) toast('✅ Student deleted from Google Sheets.', 'success')
    else toast('Deleted locally.', 'warn')
    setDelConf(null)
  }

  const sendWA = (s) => {
    window.open(buildWhatsAppLink(s.fatherCell, admissionMsg(s)), '_blank')
  }

  const set = (field) => (value) => setForm(p => ({ ...p, [field]: value }))

  const pendingCount = getQueueCount()

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title={`Students (${allStudents.length})`} sub={source ? `Source: Google Sheets` : 'Manage all enrolled students'}>
        <div className="flex gap-2 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Icon name="sync" size={13}/>{pendingCount} pending sync
            </div>
          )}
          <Btn onClick={handleSyncNow} variant="ghost" icon="sync" size="sm" disabled={syncing}>
            {syncing ? 'Syncing…' : 'Fetch from Sheets'}
          </Btn>
          <Btn onClick={openAdd} variant="primary" icon="plus">Add Student</Btn>
        </div>
      </PageHeader>

      {/* Source indicator */}
      {source && (
        <div className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl border ${source === 'sheets' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <span className={`w-2 h-2 rounded-full ${source === 'sheets' ? 'bg-emerald-500' : 'bg-amber-500'}`}/>
          {source === 'sheets'
            ? `✅ ${allStudents.length} students loaded from Google Sheets`
            : `⚠️ Showing cached data — Google Sheets not reachable`
          }
          <button onClick={handleSyncNow} className="ml-auto underline font-semibold hover:opacity-80">
            Refresh
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={16}/>
          </span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, admission#, cell, family#…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"/>
        </div>
        <select value={classFilter} onChange={e => setClass(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
          <option value="All">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Class filter chips */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CLASSES].map(c => {
          const count = c === 'All' ? allStudents.length : allStudents.filter(s => s.class === c).length
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
        {loading ? (
          <div className="p-6"><Skeleton rows={6}/></div>
        ) : (
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
                    {allStudents.length === 0
                      ? <Empty icon="students" title="No students yet"
                          sub="Add your first student using the Add Student button, or fetch from Google Sheets"/>
                      : <Empty icon="search" title="No students match your search"
                          sub="Try a different name or class"/>
                    }
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id || i} className="table-row border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                          {(s.name||'?')[0]}
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
                        <button onClick={() => openEdit(s)} title="Edit"
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Icon name="edit" size={15}/>
                        </button>
                        <button onClick={() => sendWA(s)} title="WhatsApp"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                          <Icon name="whatsapp" size={15}/>
                        </button>
                        <button onClick={() => setDelConf(s)} title="Delete"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Icon name="trash" size={15}/>
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
                        ? Math.round(allStudents.reduce((a,s) => a + Number(s.monthlyFee||0), 0) / allStudents.length).toLocaleString()
                        : 0}
                    </td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editStudent ? `Edit — ${editStudent.name}` : 'Add New Student'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Name"     value={form.name}          onChange={set('name')}          placeholder="Full name"          required/>
          <Input label="Father Name"      value={form.father}        onChange={set('father')}        placeholder="Father's full name" required/>
          <Input label="Admission Number" value={form.admission}     onChange={set('admission')}     placeholder="KS-2024-XXX"        required/>
          <Input label="Family Number"    value={form.family}        onChange={set('family')}        placeholder="FAM-XXX"/>
          <Select label="Kinship"         value={form.kinship}       onChange={set('kinship')}       options={['Son','Daughter','Other']}/>
          <Select label="Class"           value={form.class}         onChange={set('class')}         options={CLASSES}                required/>
          <Input label="Father Cell"      value={form.fatherCell}    onChange={set('fatherCell')}    placeholder="03XX-XXXXXXX" type="tel"/>
          <Input label="Mother Cell"      value={form.motherCell}    onChange={set('motherCell')}    placeholder="03XX-XXXXXXX" type="tel"/>
          <Input label="Monthly Fee (Rs)" value={form.monthlyFee}    onChange={set('monthlyFee')}    type="number"/>
          <Input label="Paper Fund (Rs)"  value={form.paperFund}     onChange={set('paperFund')}     type="number"/>
          <Input label="Admission Date"   value={form.admissionDate} onChange={set('admissionDate')} type="date"/>
          <Input label="Address"          value={form.address}       onChange={set('address')}       placeholder="Full address"/>
        </div>

        {(form.monthlyFee || form.paperFund) && (
          <div className="mt-4 flex gap-3 p-3 bg-blue-50 rounded-xl text-sm">
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500">Monthly Fee</div>
              <div className="font-bold font-mono-num text-blue-700">Rs. {Number(form.monthlyFee||0).toLocaleString()}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500">Paper Fund</div>
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
            {saving ? '⏳ Saving to Sheets…' : editStudent ? '💾 Update Student' : '💾 Save Student'}
          </Btn>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConf(null)} title="Delete Student" size="sm">
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
            {(delConfirm?.name||'?')[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{delConfirm?.name}</div>
            <div className="text-xs text-slate-500">{delConfirm?.class} • {delConfirm?.admission}</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          This will permanently delete the student from Google Sheets. Cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Btn onClick={() => setDelConf(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirmDelete} variant="danger" icon="trash">Delete Student</Btn>
        </div>
      </Modal>
    </div>
  )
}
