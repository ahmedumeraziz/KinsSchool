import React, { useState, useEffect, useCallback } from 'react'
import { Card, Btn, Input, Badge, Icon, Modal, Empty, Skeleton } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { formatRs, generateReceiptNo, buildWhatsAppLink, feeReminderMsg, today } from '../../utils/helpers'
import { syncFee, syncReceipt, getQueueCount } from '../../utils/syncService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const ALL_MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SCHOOL_ORDER = ['February','March','April','May','June','July','August','September','October','November','December','January']

const getStudentMonths = (admissionDate) => {
  const now          = new Date()
  const currentMonth = ALL_MONTHS[now.getMonth()]
  let startMonth     = 'February'
  if (admissionDate) {
    const d = new Date(admissionDate)
    if (!isNaN(d)) startMonth = ALL_MONTHS[d.getMonth()]
  }
  const startIdx   = SCHOOL_ORDER.indexOf(startMonth)
  const currentIdx = SCHOOL_ORDER.indexOf(currentMonth)
  if (startIdx === -1 || currentIdx === -1) return SCHOOL_ORDER.slice(0, (currentIdx === -1 ? 0 : currentIdx) + 1)
  if (startIdx <= currentIdx) return SCHOOL_ORDER.slice(startIdx, currentIdx + 1)
  return SCHOOL_ORDER.slice(startIdx)
}

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' }

const INIT_FEES = (s) => {
  const months = getStudentMonths(s?.admissionDate)
  return {
    paperFund:  { agreed: Number(s?.paperFund)||0, paid: 0, status: 'unpaid' },
    months:     Object.fromEntries(months.map(m => [m, { agreed: Number(s?.monthlyFee)||0, paid: 0, status: 'unpaid' }])),
    stationary: [],
    remaining:  (Number(s?.paperFund)||0) + months.length * (Number(s?.monthlyFee)||0),
    notes:      '',
  }
}

const calcRemaining = (fee) => {
  const pfDue     = Math.max(0, (Number(fee.paperFund?.agreed)||0) - (Number(fee.paperFund?.paid)||0))
  const monthsDue = Object.values(fee.months || {}).reduce((a, m) =>
    a + Math.max(0, (Number(m.agreed)||0) - (Number(m.paid)||0)), 0)
  const statTotal = (fee.stationary||[]).reduce((a, s) => a + (Number(s.total)||0), 0)
  return pfDue + monthsDue + statTotal
}

export default function FeeCollectionPage({ toast }) {
  const { students: storeStudents, fees: storeFees, updateFee, token } = useAppStore()

  const [loading, setLoading]         = useState(false)
  const [query, setQuery]             = useState('')
  const [selected, setSelected]       = useState(null)
  const [feeData, setFeeData]         = useState({})
  const [activeTab, setActiveTab]     = useState('monthly')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const receiptRef = React.useRef()

  // Load fees from store into local feeData on mount
  useEffect(() => {
    if (storeFees && Object.keys(storeFees).length > 0) {
      setFeeData(storeFees)
    }
  }, [])

  // Auto-fetch students if empty
  useEffect(() => {
    if (storeStudents.length === 0 && API_URL && token && token !== 'demo-token-offline') {
      setLoading(true)
      fetch(`${API_URL}/api/students`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.students?.length) {
            useAppStore.getState().setStudents(data.students)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  const getFee = useCallback((student) => {
    if (!student) return null
    const stored = feeData[student.id] || storeFees?.[student.id]
    if (stored && stored.months) return stored
    return INIT_FEES(student)
  }, [feeData, storeFees])

  // Search across ALL fields — no blank screen
  const filtered = query.trim()
    ? storeStudents.filter(s => {
        const q = query.toLowerCase().trim()
        return (
          String(s.name        || '').toLowerCase().includes(q) ||
          String(s.father      || '').toLowerCase().includes(q) ||
          String(s.fatherCell  || '').includes(q)               ||
          String(s.motherCell  || '').includes(q)               ||
          String(s.kinship     || '').toLowerCase().includes(q) ||
          String(s.admission   || '').toLowerCase().includes(q) ||
          String(s.family      || '').toLowerCase().includes(q) ||
          String(s.class       || '').toLowerCase().includes(q)
        )
      })
    : storeStudents

  const selectStudent = (s) => {
    setSelected(s)
    setQuery(s.name)
    setShowDropdown(false)
    // Init fee if not already set
    if (!feeData[s.id] && !storeFees?.[s.id]) {
      const init = INIT_FEES(s)
      setFeeData(p => ({ ...p, [s.id]: init }))
    }
  }

  const setFeeField = (updater) => {
    if (!selected) return
    setFeeData(p => {
      const current = p[selected.id] || getFee(selected)
      const updated = updater({ ...current })
      updated.remaining = calcRemaining(updated)
      return { ...p, [selected.id]: updated }
    })
  }

  const updateMonth = (month, field, value) => {
    setFeeField(fee => {
      const m = { ...(fee.months?.[month] || { agreed: Number(selected?.monthlyFee)||0, paid: 0, status: 'unpaid' }), [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        m.status = paid <= 0 ? 'unpaid' : paid >= Number(m.agreed) ? 'paid' : 'partial'
        if (m.status !== 'unpaid') m.date = today()
      }
      return { ...fee, months: { ...(fee.months||{}), [month]: m } }
    })
  }

  const updatePaperFund = (field, value) => {
    setFeeField(fee => {
      const pf = { ...(fee.paperFund||{}), [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        pf.status = paid <= 0 ? 'unpaid' : paid >= Number(pf.agreed) ? 'paid' : 'partial'
        if (pf.status !== 'unpaid') pf.date = today()
      }
      return { ...fee, paperFund: pf }
    })
  }

  const addStationary = () => {
    setFeeField(fee => ({
      ...fee,
      stationary: [...(fee.stationary||[]), { id: Date.now(), item: '', qty: 1, price: 0, total: 0 }]
    }))
  }

  const updateStationary = (id, field, value) => {
    setFeeField(fee => ({
      ...fee,
      stationary: (fee.stationary||[]).map(s => {
        if (s.id !== id) return s
        const u = { ...s, [field]: value }
        u.total = (Number(u.qty)||0) * (Number(u.price)||0)
        return u
      })
    }))
  }

  const removeStationary = (id) => {
    setFeeField(fee => ({ ...fee, stationary: (fee.stationary||[]).filter(s => s.id !== id) }))
  }

  const saveFee = async () => {
    if (!selected) return
    setSaving(true)
    const fee     = getFee(selected)
    const payload = { studentId: selected.id, studentName: selected.name, ...fee }
    updateFee(selected.id, payload)
    setFeeData(p => ({ ...p, [selected.id]: payload }))
    const result  = await syncFee(payload)
    if (result.ok)     toast('✅ Saved to Google Sheets!', 'success')
    else if (result.queued) toast(`💾 Saved locally. Will sync when online.`, 'warn')
    setSaving(false)
  }

  const handlePDF = async () => {
    if (!receiptRef.current) return
    const canvas = await html2canvas(receiptRef.current, { scale: 2 })
    const pdf = new jsPDF('p', 'mm', 'a5')
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 148, 210)
    pdf.save(`Receipt-${generateReceiptNo()}.pdf`)
    toast('PDF downloaded!', 'success')
  }

  const handleReceiptWA = async () => {
    const fee = getFee(selected)
    if (!selected || !fee) return
    const activeMonths = getStudentMonths(selected.admissionDate)
    const paidMonths   = activeMonths.filter(m => fee.months?.[m]?.status !== 'unpaid')
    const totalPaid    = paidMonths.reduce((a, m) => a + (Number(fee.months[m]?.paid)||0), 0)
      + (fee.paperFund?.status !== 'unpaid' ? Number(fee.paperFund?.paid)||0 : 0)
      + (fee.stationary||[]).reduce((a, s) => a + (s.total||0), 0)
    await syncReceipt({
      studentId: selected.id, studentName: selected.name,
      father: selected.father, class: selected.class,
      admission: selected.admission, receiptNo: generateReceiptNo(),
      totalPaid, remaining: fee.remaining,
      paidMonths: paidMonths.join(', '),
      paperFundPaid: fee.paperFund?.status !== 'unpaid' ? fee.paperFund?.paid : 0,
      stationaryTotal: (fee.stationary||[]).reduce((a, s) => a + s.total, 0),
      date: today(), time: new Date().toLocaleTimeString('en-GB'),
    })
    const msg = feeReminderMsg(selected, fee.remaining, new Date().toLocaleString('default', { month: 'long' }))
    window.open(buildWhatsAppLink(selected.fatherCell, msg), '_blank')
  }

  const fee          = selected ? getFee(selected) : null
  const activeMonths = selected ? getStudentMonths(selected.admissionDate) : []
  const currentLabel = ALL_MONTHS[new Date().getMonth()]
  const defaultMonths = getStudentMonths(null)
  const paidMonths   = fee ? activeMonths.filter(m => fee.months?.[m]?.status !== 'unpaid') : []
  const totalPaid    = fee ? (
    paidMonths.reduce((a, m) => a + (Number(fee.months[m]?.paid)||0), 0)
    + (fee.paperFund?.status !== 'unpaid' ? Number(fee.paperFund?.paid)||0 : 0)
    + (fee.stationary||[]).reduce((a, s) => a + (s.total||0), 0)
  ) : 0

  return (
    <div className="p-4 flex flex-col gap-4 animate-fade-up">

      {/* ── Header Row ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-base font-bold text-slate-900">Fee Collection</div>
          <div className="text-xs text-slate-400">
            Active: Feb → {currentLabel} ({defaultMonths.length} months)
            {getQueueCount() > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">• {getQueueCount()} pending sync</span>
            )}
          </div>
        </div>

        {/* ── Search bar — single input, searches all fields ── */}
        <div className="flex-1 min-w-64 max-w-lg relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon name="search" size={15}/>
          </span>
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setShowDropdown(true)
              if (selected && e.target.value !== selected.name) setSelected(null)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name, father, cell, kinship, adm#, family#…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
          />

          {/* Dropdown */}
          {showDropdown && !selected && filtered.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
              {filtered.slice(0, 8).map(s => {
                const sFee      = getFee(s)
                const remaining = sFee ? calcRemaining(sFee) : 0
                return (
                  <button key={s.id} onMouseDown={() => selectStudent(s)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 text-left">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                      <span className="text-slate-400 text-xs ml-1.5">
                        {s.kinship ? `${s.kinship} of` : 'S/D/o'} {s.father}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color="blue">{s.class}</Badge>
                      {remaining > 0 && (
                        <span className="text-xs font-bold font-mono-num text-red-600">
                          {formatRs(remaining)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
              {filtered.length > 8 && (
                <div className="px-4 py-2 text-xs text-slate-400 text-center border-t border-slate-100">
                  {filtered.length - 8} more — type to narrow down
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── All students list (when no search and none selected) ── */}
      {!selected && !query.trim() && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">All Students</span>
            <span className="text-xs text-slate-400">{storeStudents.length} students</span>
          </div>
          {loading ? (
            <div className="p-4"><Skeleton rows={4}/></div>
          ) : storeStudents.length === 0 ? (
            <Empty icon="students" title="No students loaded" sub="Add students first from the Students tab"/>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Student','Class','Adm#','Remaining Balance','Action'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {storeStudents.map((s, i) => {
                    const sFee      = getFee(s)
                    const remaining = sFee ? calcRemaining(sFee) : (Number(s.paperFund)||0) + getStudentMonths(s.admissionDate).length * (Number(s.monthlyFee)||0)
                    return (
                      <tr key={s.id || i} className="table-row border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-400">
                            {s.kinship ? `${s.kinship} of` : 'S/D/o'} {s.father}
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><Badge color="blue">{s.class}</Badge></td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{s.admission}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-bold font-mono-num ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatRs(remaining)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Btn onClick={() => selectStudent(s)} variant="outline" size="sm">
                            Collect Fee
                          </Btn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Student Fee Card ── */}
      {selected && fee && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            {/* Row 1: Name + Receipt */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-lg font-bold text-slate-900">{selected.name}</span>
                <span className="text-sm text-slate-500 ml-2">
                  {selected.kinship ? `${selected.kinship} of` : 'S/D/o'} {selected.father}
                </span>
              </div>
              <div className="flex gap-2">
                <Btn onClick={() => { setSelected(null); setQuery('') }} variant="ghost" size="sm">✕ Close</Btn>
                <Btn onClick={() => setReceiptOpen(true)} variant="success" icon="receipt" size="sm">Receipt</Btn>
              </div>
            </div>

            {/* Row 2: Details + Remaining */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm flex-1">
                {[
                  ['Class',      selected.class],
                  ['Adm #',      selected.admission],
                  ['Family #',   selected.family || '—'],
                  ['Kinship',    selected.kinship || '—'],
                  ['Father Cell',selected.fatherCell],
                  ['Mother Cell',selected.motherCell || '—'],
                ].map(([l,v]) => (
                  <div key={l}>
                    <span className="text-xs text-slate-400">{l} </span>
                    <span className="font-semibold text-slate-800 text-xs">{v}</span>
                  </div>
                ))}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Remaining</div>
                <div className="text-2xl font-bold font-mono-num text-red-600">{formatRs(fee.remaining)}</div>
              </div>
            </div>

            {/* Row 3: Notes + Save */}
            <div className="flex gap-3 items-center">
              <input
                value={fee.notes || ''}
                onChange={e => setFeeField(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Btn onClick={saveFee} variant="primary" icon="save" disabled={saving}>
                {saving ? 'Saving…' : 'Save to Sheets'}
              </Btn>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[['monthly','Monthly Fees'],['paperfund','Paper Fund'],['stationary','Stationary']].map(([k,l]) => (
              <button key={k} onClick={() => setActiveTab(k)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab===k ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Monthly Fees */}
          {activeTab === 'monthly' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {activeMonths.map(month => {
                const m     = fee.months?.[month] || { agreed: Number(selected.monthlyFee)||0, paid: 0, status: 'unpaid' }
                const color = statusColor[m.status] || 'red'
                return (
                  <div key={month} className={`bg-white rounded-xl border border-slate-200 border-l-4 p-3 ${color==='green'?'border-l-emerald-400':color==='amber'?'border-l-amber-400':'border-l-red-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">{month.slice(0,3)}</span>
                      <Badge color={color} className="text-[10px]">{m.status?.slice(0,4).toUpperCase()}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-1.5">
                      Rs.<span className="font-mono font-semibold text-slate-600">{Number(m.agreed).toLocaleString()}</span>
                    </div>
                    <input type="number" value={m.paid||''}
                      onChange={e => updateMonth(month,'paid',e.target.value)}
                      placeholder="Paid" min={0}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono outline-none focus:border-blue-500 mb-1.5"/>
                    <div className="flex gap-1">
                      <button onClick={() => updateMonth(month,'paid',m.agreed)}
                        className="flex-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded py-1 font-semibold hover:bg-emerald-100">
                        Full
                      </button>
                      <button onClick={() => updateMonth(month,'paid',0)}
                        className="text-[11px] bg-red-50 text-red-500 border border-red-200 rounded px-1.5 py-1 font-semibold hover:bg-red-100">
                        ✕
                      </button>
                    </div>
                    {m.date && <div className="text-[10px] text-slate-400 mt-1">{m.date}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Paper Fund */}
          {activeTab === 'paperfund' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 max-w-sm">
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg mb-3">
                <span className="text-sm text-slate-600">Agreed Amount</span>
                <span className="font-bold font-mono-num">{formatRs(fee.paperFund?.agreed)}</span>
              </div>
              <input type="number" value={fee.paperFund?.paid||''}
                onChange={e => updatePaperFund('paid', e.target.value)}
                placeholder="Payment amount"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-mono outline-none focus:border-blue-500 mb-3"/>
              <div className="flex gap-2 mb-3">
                <Btn onClick={() => updatePaperFund('paid', fee.paperFund?.agreed)} variant="success" className="flex-1 justify-center">Full</Btn>
                <Btn onClick={saveFee} variant="primary" className="flex-1 justify-center" disabled={saving}>{saving?'Saving…':'Save'}</Btn>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Status</span>
                <Badge color={statusColor[fee.paperFund?.status||'unpaid']}>{(fee.paperFund?.status||'unpaid').toUpperCase()}</Badge>
              </div>
              {fee.paperFund?.date && <div className="text-xs text-slate-400">Paid: {fee.paperFund.date}</div>}
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Unpaid: <strong>{formatRs(Math.max(0,(Number(fee.paperFund?.agreed)||0)-(Number(fee.paperFund?.paid)||0)))}</strong> in Remaining
              </div>
            </div>
          )}

          {/* Stationary */}
          {activeTab === 'stationary' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">Stationary Items</span>
                <Btn onClick={addStationary} variant="primary" icon="plus" size="sm">Add Item</Btn>
              </div>
              {(!fee.stationary || fee.stationary.length === 0)
                ? <Empty icon="stationary" title="No items" sub="Click Add Item"/>
                : (
                  <>
                    <div className="flex flex-col gap-2">
                      {fee.stationary.map((s, idx) => (
                        <div key={s.id} className="grid grid-cols-10 gap-2 items-end">
                          <div className="col-span-4">
                            {idx===0 && <div className="text-xs text-slate-400 mb-1">Item</div>}
                            <input value={s.item} onChange={e => updateStationary(s.id,'item',e.target.value)} placeholder="Item name"
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"/>
                          </div>
                          <div className="col-span-2">
                            {idx===0 && <div className="text-xs text-slate-400 mb-1">Qty</div>}
                            <input type="number" value={s.qty} onChange={e => updateStationary(s.id,'qty',e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"/>
                          </div>
                          <div className="col-span-2">
                            {idx===0 && <div className="text-xs text-slate-400 mb-1">Price</div>}
                            <input type="number" value={s.price} onChange={e => updateStationary(s.id,'price',e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"/>
                          </div>
                          <div className="col-span-1 text-sm font-bold font-mono-num text-emerald-700 pb-1.5 text-center">{formatRs(s.total)}</div>
                          <div className="col-span-1 flex justify-center pb-1.5">
                            <button onClick={() => removeStationary(s.id)} className="text-red-400 hover:text-red-600"><Icon name="trash" size={15}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Added to Remaining</span>
                      <span className="font-bold font-mono-num text-emerald-700">Total: {formatRs((fee.stationary||[]).reduce((a,s)=>a+s.total,0))}</span>
                    </div>
                    <div className="mt-3">
                      <Btn onClick={saveFee} variant="primary" icon="save" disabled={saving} className="w-full justify-center">
                        {saving ? '⏳ Saving…' : '💾 Save to Google Sheets'}
                      </Btn>
                    </div>
                  </>
                )
              }
            </div>
          )}
        </>
      )}

      {/* Receipt Modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Fee Receipt" size="lg">
        {selected && fee && (
          <>
            <div ref={receiptRef} className="bg-white p-6 rounded-xl">
              <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
                <div className="text-2xl font-display font-bold text-blue-800">🎓 KINS SCHOOL</div>
                <div className="text-xs text-slate-500">Ratta Rd, Kins St, Gujranwala</div>
                <div className="flex justify-between mt-2 text-xs text-slate-600">
                  <span>Receipt #: <strong>{generateReceiptNo()}</strong></span>
                  <span>Date: <strong>{today()}</strong></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                {[['Student',selected.name],['Father',selected.father],['Class',selected.class],['Admission#',selected.admission]].map(([l,v]) => (
                  <div key={l}><span className="text-slate-500">{l}: </span><strong>{v}</strong></div>
                ))}
              </div>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-200 px-3 py-2 text-left text-xs font-bold text-blue-800">Description</th>
                    <th className="border border-slate-200 px-3 py-2 text-right text-xs font-bold text-blue-800">Amount</th>
                    <th className="border border-slate-200 px-3 py-2 text-center text-xs font-bold text-blue-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidMonths.map(m => (
                    <tr key={m}>
                      <td className="border border-slate-200 px-3 py-1.5">{m} Fee</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono-num">{formatRs(fee.months[m]?.paid)}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center"><Badge color={statusColor[fee.months[m]?.status]} className="text-[10px]">{fee.months[m]?.status}</Badge></td>
                    </tr>
                  ))}
                  {fee.paperFund?.status !== 'unpaid' && (
                    <tr>
                      <td className="border border-slate-200 px-3 py-1.5">Annual Paper Fund</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono-num">{formatRs(fee.paperFund?.paid)}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center"><Badge color={statusColor[fee.paperFund?.status]} className="text-[10px]">{fee.paperFund?.status}</Badge></td>
                    </tr>
                  )}
                  {(fee.stationary||[]).filter(s=>s.total>0).map(s => (
                    <tr key={s.id}>
                      <td className="border border-slate-200 px-3 py-1.5">Stationary: {s.item} ×{s.qty}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono-num">{formatRs(s.total)}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center"><Badge color="blue" className="text-[10px]">SOLD</Badge></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50">
                    <td className="border border-slate-200 px-3 py-2 font-bold">Total Paid</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-bold font-mono-num text-emerald-700">{formatRs(totalPaid)}</td>
                    <td className="border border-slate-200"></td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="border border-slate-200 px-3 py-2 font-bold text-red-700">Remaining Balance</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-bold font-mono-num text-red-600">{formatRs(fee.remaining)}</td>
                    <td className="border border-slate-200"></td>
                  </tr>
                </tfoot>
              </table>
              <div className="flex justify-between text-xs text-slate-400 border-t pt-3">
                <span>Period: {activeMonths[0]} → {activeMonths[activeMonths.length-1]}</span>
                <span>KINS SCHOOL — Gujranwala</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 no-print">
              <Btn onClick={() => window.print()} variant="ghost" icon="print">Print</Btn>
              <Btn onClick={handlePDF} variant="primary" icon="download">PDF</Btn>
              <Btn onClick={handleReceiptWA} variant="whatsapp" icon="whatsapp">WhatsApp</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
