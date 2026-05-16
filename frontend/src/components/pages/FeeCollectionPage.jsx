import React, { useState, useRef } from 'react'
import { Card, Btn, Input, Badge, Icon, Modal, PageHeader, Empty } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { formatRs, generateReceiptNo, buildWhatsAppLink, feeReminderMsg, today } from '../../utils/helpers'
import { syncFee, syncReceipt, getQueueCount } from '../../utils/syncService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const CLASSES = [
  'Nursery','Prep',
  'One Boys','One Girls','Two Boys','Two Girls',
  'Three Boys','Three Girls','Four Boys','Four Girls',
  'Five Boys','Five Girls','Six Boys','Six Girls',
  'Seven Boys','Seven Girls','Eight Boys','Eight Girls',
  'Nine Boys','Nine Girls',
]

const ALL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SCHOOL_ORDER = ['February','March','April','May','June','July','August','September','October','November','December','January']

// Get months from student's admission month up to current month (school year Feb→Jan)
const getStudentMonths = (admissionDate) => {
  const now          = new Date()
  const currentMonth = now.toLocaleString('default', { month: 'long' })
  const currentYear  = now.getFullYear()

  let startMonth = 'February' // default
  if (admissionDate) {
    const d = new Date(admissionDate)
    if (!isNaN(d)) startMonth = ALL_MONTHS[d.getMonth()]
  }

  const startIdx   = SCHOOL_ORDER.indexOf(startMonth)
  const currentIdx = SCHOOL_ORDER.indexOf(currentMonth)

  if (startIdx === -1 || currentIdx === -1) return SCHOOL_ORDER.slice(0, currentIdx + 1)

  // From admission month to current month
  if (startIdx <= currentIdx) {
    return SCHOOL_ORDER.slice(startIdx, currentIdx + 1)
  }
  // Wraps around (admission after current month in school year — edge case)
  return SCHOOL_ORDER.slice(startIdx)
}

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' }

const INIT_FEES = (s) => {
  const months = getStudentMonths(s.admissionDate)
  return {
    paperFund:  { agreed: s.paperFund || 0, paid: 0, status: 'unpaid' },
    months:     Object.fromEntries(months.map(m => [m, { agreed: s.monthlyFee || 0, paid: 0, status: 'unpaid' }])),
    stationary: [],
    remaining:  0,
    notes:      '',
  }
}

const calcRemaining = (fee) => {
  const pfDue     = Math.max(0, (Number(fee.paperFund?.agreed)||0) - (Number(fee.paperFund?.paid)||0))
  const monthsDue = Object.values(fee.months).reduce((a, m) =>
    a + Math.max(0, (Number(m.agreed)||0) - (Number(m.paid)||0)), 0)
  const statTotal = (fee.stationary||[]).reduce((a, s) => a + (s.total||0), 0)
  return pfDue + monthsDue + statTotal
}

export default function FeeCollectionPage({ toast }) {
  const { students: storeStudents, updateFee } = useAppStore()

  const [query, setQuery]             = useState('')
  const [searchBy, setSearchBy]       = useState('name')
  const [selected, setSelected]       = useState(null)
  const [feeData, setFeeData]         = useState({})
  const [activeTab, setActiveTab]     = useState('monthly')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [saving, setSaving]           = useState(false)
  const receiptRef = useRef()

  const getFee = (id) => feeData[id] || (selected ? INIT_FEES(selected) : null)

  // Search across all fields
  const filtered = storeStudents.filter(s => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (s.name        || '').toLowerCase().includes(q) ||
      (s.father      || '').toLowerCase().includes(q) ||
      (s.fatherCell  || '').includes(q)               ||
      (s.motherCell  || '').includes(q)               ||
      (s.kinship     || '').toLowerCase().includes(q) ||
      (s.admission   || '').toLowerCase().includes(q) ||
      (s.family      || '').toLowerCase().includes(q)
    )
  })

  const selectStudent = (s) => {
    setSelected(s)
    if (!feeData[s.id]) setFeeData(p => ({ ...p, [s.id]: INIT_FEES(s) }))
    setQuery(s.name)
  }

  const setFeeField = (updater) => {
    setFeeData(p => {
      const current = p[selected.id] || INIT_FEES(selected)
      const updated = updater(current)
      updated.remaining = calcRemaining(updated)
      return { ...p, [selected.id]: updated }
    })
  }

  const updateMonth = (month, field, value) => {
    setFeeField(fee => {
      const m = { ...(fee.months[month] || { agreed: selected.monthlyFee||0, paid: 0, status: 'unpaid' }), [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        m.status = paid <= 0 ? 'unpaid' : paid >= m.agreed ? 'paid' : 'partial'
        if (m.status !== 'unpaid') m.date = today()
      }
      return { ...fee, months: { ...fee.months, [month]: m } }
    })
  }

  const updatePaperFund = (field, value) => {
    setFeeField(fee => {
      const pf = { ...fee.paperFund, [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        pf.status = paid <= 0 ? 'unpaid' : paid >= pf.agreed ? 'paid' : 'partial'
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
      stationary: fee.stationary.map(s => {
        if (s.id !== id) return s
        const u = { ...s, [field]: value }
        u.total = (Number(u.qty)||0) * (Number(u.price)||0)
        return u
      })
    }))
  }

  const removeStationary = (id) => {
    setFeeField(fee => ({ ...fee, stationary: fee.stationary.filter(s => s.id !== id) }))
  }

  const saveFee = async () => {
    if (!selected) return
    setSaving(true)
    const fee = getFee(selected.id)
    const payload = { studentId: selected.id, studentName: selected.name, ...fee }
    updateFee(selected.id, payload)
    const result = await syncFee(payload)
    if (result.ok) toast('✅ Saved to Google Sheets!', 'success')
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
    const fee = getFee(selected?.id)
    if (!selected || !fee) return
    const activeMonths = getStudentMonths(selected.admissionDate)
    const paidMonths   = activeMonths.filter(m => fee.months[m]?.status !== 'unpaid')
    const totalPaid    = paidMonths.reduce((a,m) => a + (Number(fee.months[m]?.paid)||0), 0)
      + (fee.paperFund?.status !== 'unpaid' ? Number(fee.paperFund?.paid)||0 : 0)
      + (fee.stationary||[]).reduce((a,s) => a + (s.total||0), 0)
    await syncReceipt({
      studentId: selected.id, studentName: selected.name,
      father: selected.father, class: selected.class,
      admission: selected.admission, receiptNo: generateReceiptNo(),
      totalPaid, remaining: fee.remaining,
      paidMonths: paidMonths.join(', '),
      paperFundPaid: fee.paperFund?.status !== 'unpaid' ? fee.paperFund?.paid : 0,
      stationaryTotal: (fee.stationary||[]).reduce((a,s)=>a+s.total,0),
      date: today(), time: new Date().toLocaleTimeString('en-GB'),
    })
    const msg = feeReminderMsg(selected, fee.remaining, new Date().toLocaleString('default',{month:'long'}))
    window.open(buildWhatsAppLink(selected.fatherCell, msg), '_blank')
  }

  const fee = selected ? getFee(selected.id) : null
  const activeMonths = selected ? getStudentMonths(selected.admissionDate) : []
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long' })
  const paidMonths = fee ? activeMonths.filter(m => fee.months[m]?.status !== 'unpaid') : []
  const totalPaid  = fee ? (
    paidMonths.reduce((a,m) => a + (Number(fee.months[m]?.paid)||0), 0)
    + (fee.paperFund?.status !== 'unpaid' ? Number(fee.paperFund?.paid)||0 : 0)
    + (fee.stationary||[]).reduce((a,s) => a + (s.total||0), 0)
  ) : 0

  return (
    <div className="p-4 flex flex-col gap-4 animate-fade-up">

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="shrink-0">
          <div className="text-base font-bold text-slate-900">Fee Collection</div>
          <div className="text-xs text-slate-400">
            Active: Feb → {currentMonthLabel} ({activeMonths.length || getStudentMonths(null).length} months)
          </div>
        </div>

        {/* Search type chips + input */}
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1 flex-wrap">
            {[['name','Name'],['father','Father'],['cell','Cell'],['kinship','Kinship'],['admission','Adm#'],['family','Family#']].map(([k,l]) => (
              <button key={k} onClick={() => setSearchBy(k)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${searchBy===k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={15}/></span>
            <input value={query}
              onChange={e => { setQuery(e.target.value); if (selected && e.target.value !== selected.name) setSelected(null) }}
              placeholder={`Search by ${searchBy}…`}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"/>
          </div>
        </div>

        {getQueueCount() > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
            <Icon name="sync" size={12}/>{getQueueCount()} pending
          </div>
        )}
      </div>

      {/* Search dropdown */}
      {query && !selected && filtered.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg -mt-2">
          {filtered.slice(0,6).map(s => (
            <button key={s.id} onClick={() => selectStudent(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 text-left">
              <div>
                <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                <span className="text-slate-400 text-xs ml-1">S/D/o {s.father}</span>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge color="blue">{s.class}</Badge>
                <span className="text-xs text-slate-400">{s.admission}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Student card */}
      {selected && fee && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            {/* Row 1: Name + Receipt button */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-lg font-bold text-slate-900">{selected.name}</span>
                <span className="text-sm text-slate-500 ml-2">
                  {selected.kinship ? `${selected.kinship} of` : 'S/D/o'} {selected.father}
                </span>
              </div>
              <Btn onClick={() => setReceiptOpen(true)} variant="success" icon="receipt" size="sm">Receipt</Btn>
            </div>

            {/* Row 2: Details + Remaining */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm flex-1">
                <div><span className="text-xs text-slate-400">Class</span><div className="font-semibold text-slate-800">{selected.class}</div></div>
                <div><span className="text-xs text-slate-400">Adm #</span><div className="font-mono text-slate-700 text-xs">{selected.admission}</div></div>
                <div><span className="text-xs text-slate-400">Family #</span><div className="font-mono text-slate-700 text-xs">{selected.family||'—'}</div></div>
                <div><span className="text-xs text-slate-400">Kinship</span><div className="text-slate-700 text-xs">{selected.kinship||'—'}</div></div>
                <div><span className="text-xs text-slate-400">Father Cell</span><div className="text-slate-700 text-xs">{selected.fatherCell}</div></div>
                <div><span className="text-xs text-slate-400">Mother Cell</span><div className="text-slate-700 text-xs">{selected.motherCell||'—'}</div></div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Remaining</div>
                <div className="text-2xl font-bold font-mono-num text-red-600">{formatRs(fee.remaining)}</div>
              </div>
            </div>

            {/* Row 3: Notes + Save */}
            <div className="flex gap-3 items-end">
              <input
                value={fee.notes||''}
                onChange={e => setFeeField(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"/>
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
                const m = fee.months[month] || { agreed: selected.monthlyFee||0, paid: 0, status: 'unpaid' }
                const color = statusColor[m.status]
                return (
                  <div key={month} className={`bg-white rounded-xl border-l-4 border border-slate-200 p-3 ${color==='green'?'border-l-emerald-400':color==='amber'?'border-l-amber-400':'border-l-red-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">{month.slice(0,3)}</span>
                      <Badge color={color} className="text-[10px]">{m.status.slice(0,4).toUpperCase()}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-1.5">
                      Agreed: <span className="font-mono font-semibold text-slate-600">Rs.{Number(m.agreed).toLocaleString()}</span>
                    </div>
                    <input type="number" value={m.paid||''} onChange={e => updateMonth(month,'paid',e.target.value)}
                      placeholder="Paid" min={0}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 mb-1.5"/>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 max-w-sm">
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg mb-3">
                <span className="text-sm text-slate-600">Agreed Amount</span>
                <span className="font-bold font-mono-num text-slate-900">{formatRs(fee.paperFund.agreed)}</span>
              </div>
              <input type="number" value={fee.paperFund.paid||''}
                onChange={e => updatePaperFund('paid', e.target.value)}
                placeholder="Payment amount"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-3"/>
              <div className="flex gap-2 mb-3">
                <Btn onClick={() => updatePaperFund('paid', fee.paperFund.agreed)} variant="success" className="flex-1 justify-center">Full Payment</Btn>
                <Btn onClick={saveFee} variant="primary" className="flex-1 justify-center" disabled={saving}>{saving?'Saving…':'Save'}</Btn>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <Badge color={statusColor[fee.paperFund.status]}>{fee.paperFund.status.toUpperCase()}</Badge>
              </div>
              {fee.paperFund.date && <div className="text-xs text-slate-400 mt-1">Paid: {fee.paperFund.date}</div>}
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Unpaid: <strong>{formatRs(Math.max(0,(fee.paperFund.agreed||0)-(Number(fee.paperFund.paid)||0)))}</strong> added to Remaining Balance
              </div>
            </div>
          )}

          {/* Stationary */}
          {activeTab === 'stationary' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
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
                            <input value={s.item} onChange={e => updateStationary(s.id,'item',e.target.value)}
                              placeholder="Item name"
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
                          <div className="col-span-1 text-sm font-bold font-mono-num text-emerald-700 pb-1.5 text-center">
                            {formatRs(s.total)}
                          </div>
                          <div className="col-span-1 flex justify-center pb-1.5">
                            <button onClick={() => removeStationary(s.id)} className="text-red-400 hover:text-red-600">
                              <Icon name="trash" size={15}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Added to Remaining Balance</span>
                      <span className="font-bold font-mono-num text-emerald-700">
                        Total: {formatRs(fee.stationary.reduce((a,s)=>a+s.total,0))}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Btn onClick={saveFee} variant="primary" icon="save" disabled={saving} className="w-full justify-center">
                        {saving ? '⏳ Saving…' : '💾 Save Stationary to Google Sheets'}
                      </Btn>
                    </div>
                  </>
                )
              }
            </div>
          )}
        </>
      )}

      {!selected && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Icon name="search" size={32}/>
          <div className="font-semibold text-slate-600 mt-3">Search for a student above</div>
          <div className="text-xs mt-1">Search by name, father, cell, kinship, admission# or family#</div>
        </div>
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
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono-num">{formatRs(fee.paperFund.paid)}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center"><Badge color={statusColor[fee.paperFund.status]} className="text-[10px]">{fee.paperFund.status}</Badge></td>
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
