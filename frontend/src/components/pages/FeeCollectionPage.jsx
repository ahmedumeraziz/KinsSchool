import React, { useState, useRef } from 'react'
import { Card, Btn, Input, Badge, Icon, Modal, PageHeader, Empty } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { formatRs, SCHOOL_MONTHS, generateReceiptNo, buildWhatsAppLink, feeReminderMsg, today } from '../../utils/helpers'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const DEMO_STUDENTS = [
  { id: 1, name: 'Ahmed Raza',   father: 'Muhammad Raza', admission: 'KS-2024-001', family: 'FAM-001', kinship: 'Son',      fatherCell: '0300-1234567', class: 'Class 5', paperFund: 2000, monthlyFee: 1500 },
  { id: 2, name: 'Sara Malik',   father: 'Tariq Malik',   admission: 'KS-2024-002', family: 'FAM-002', kinship: 'Daughter', fatherCell: '0311-2345678', class: 'Class 3', paperFund: 2000, monthlyFee: 1500 },
  { id: 3, name: 'Usman Ali',    father: 'Khalid Ali',    admission: 'KS-2024-003', family: 'FAM-003', kinship: 'Son',      fatherCell: '0322-3456789', class: 'Class 7', paperFund: 2500, monthlyFee: 2000 },
  { id: 4, name: 'Fatima Khan',  father: 'Imran Khan',    admission: 'KS-2024-004', family: 'FAM-004', kinship: 'Daughter', fatherCell: '0333-4567890', class: 'Class 8', paperFund: 2500, monthlyFee: 2000 },
  { id: 5, name: 'Bilal Hassan', father: 'Asif Hassan',   admission: 'KS-2024-005', family: 'FAM-001', kinship: 'Son',      fatherCell: '0300-1234567', class: 'Class 6', paperFund: 2000, monthlyFee: 1500 },
  { id: 6, name: 'Zainab Iqbal', father: 'Naveed Iqbal',  admission: 'KS-2024-006', family: 'FAM-005', kinship: 'Daughter', fatherCell: '0344-5678901', class: 'Class 4', paperFund: 2000, monthlyFee: 1500 },
]

// School year: Feb → Jan
// Returns months from Feb up to and including current month
const getActiveMonths = () => {
  const now = new Date()
  const currentMonth = now.getMonth() // 0=Jan,1=Feb,...,11=Dec
  // School months order: Feb(1),Mar(2),...,Dec(11),Jan(0)
  const schoolOrder = [1,2,3,4,5,6,7,8,9,10,11,0]
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December']

  // Determine current school year position
  // If current month is Jan(0), it's end of school year
  const activeIndices = []
  for (const mIndex of schoolOrder) {
    activeIndices.push(mIndex)
    if (mIndex === currentMonth) break
  }
  return activeIndices.map(i => monthNames[i])
}

const ACTIVE_MONTHS = getActiveMonths()

const INIT_FEES = (s) => ({
  paperFund: { agreed: s.paperFund, paid: 0, status: 'unpaid' },
  months: Object.fromEntries(ACTIVE_MONTHS.map(m => [m, { agreed: s.monthlyFee, paid: 0, status: 'unpaid' }])),
  stationary: [],
  remaining: 0,
  notes: '',
})

const statusColor = { paid: 'green', partial: 'amber', unpaid: 'red' }

// Calculate remaining: only active months (Feb → current month)
const calcRemaining = (fee) => {
  const pfDue = (Number(fee.paperFund.agreed) || 0) - (Number(fee.paperFund.paid) || 0)
  const monthsDue = Object.values(fee.months).reduce((a, m) => {
    return a + Math.max(0, (Number(m.agreed) || 0) - (Number(m.paid) || 0))
  }, 0)
  const statTotal = (fee.stationary || []).reduce((a, s) => a + (s.total || 0), 0)
  return Math.max(0, pfDue) + Math.max(0, monthsDue) + statTotal
}

export default function FeeCollectionPage({ toast }) {
  const { students: storeStudents } = useAppStore()
  const allStudents = storeStudents.length ? storeStudents : DEMO_STUDENTS

  const [query, setQuery]             = useState('')
  const [searchBy, setSearchBy]       = useState('name')
  const [selected, setSelected]       = useState(null)
  const [feeData, setFeeData]         = useState({})
  const [activeTab, setActiveTab]     = useState('monthly')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const receiptRef = useRef()

  const getFee = (id) => feeData[id] || (selected ? INIT_FEES(selected) : null)

  const filtered = allStudents.filter(s => {
    if (!query) return true
    const q = query.toLowerCase()
    if (searchBy === 'name')      return s.name.toLowerCase().includes(q)
    if (searchBy === 'admission') return s.admission.toLowerCase().includes(q)
    if (searchBy === 'family')    return s.family.toLowerCase().includes(q)
    if (searchBy === 'cell')      return s.fatherCell.includes(q)
    return true
  })

  const selectStudent = (s) => {
    setSelected(s)
    if (!feeData[s.id]) setFeeData(p => ({ ...p, [s.id]: INIT_FEES(s) }))
    setQuery(s.name)
  }

  const updateMonth = (month, field, value) => {
    setFeeData(p => {
      const fee   = { ...(p[selected.id] || INIT_FEES(selected)) }
      const m     = { ...(fee.months[month] || { agreed: selected.monthlyFee, paid: 0, status: 'unpaid' }), [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        m.status = paid <= 0 ? 'unpaid' : paid >= m.agreed ? 'paid' : 'partial'
        if (m.status !== 'unpaid') m.date = today()
      }
      fee.months = { ...fee.months, [month]: m }
      fee.remaining = calcRemaining(fee)
      return { ...p, [selected.id]: fee }
    })
  }

  const updatePaperFund = (field, value) => {
    setFeeData(p => {
      const fee = { ...(p[selected.id] || INIT_FEES(selected)) }
      const pf  = { ...fee.paperFund, [field]: value }
      if (field === 'paid') {
        const paid = Number(value) || 0
        pf.status = paid <= 0 ? 'unpaid' : paid >= pf.agreed ? 'paid' : 'partial'
        if (pf.status !== 'unpaid') pf.date = today()
      }
      fee.paperFund = pf
      fee.remaining = calcRemaining(fee)
      return { ...p, [selected.id]: fee }
    })
  }

  const addStationary = () => {
    setFeeData(p => {
      const fee = { ...(p[selected.id] || INIT_FEES(selected)) }
      fee.stationary = [...(fee.stationary || []), { id: Date.now(), item: '', qty: 1, price: 0, total: 0 }]
      fee.remaining  = calcRemaining(fee)
      return { ...p, [selected.id]: fee }
    })
  }

  const updateStationary = (id, field, value) => {
    setFeeData(p => {
      const fee = { ...(p[selected.id] || INIT_FEES(selected)) }
      fee.stationary = fee.stationary.map(s => {
        if (s.id !== id) return s
        const updated = { ...s, [field]: value }
        updated.total = (Number(updated.qty) || 0) * (Number(updated.price) || 0)
        return updated
      })
      fee.remaining = calcRemaining(fee)
      return { ...p, [selected.id]: fee }
    })
  }

  const removeStationary = (id) => {
    setFeeData(p => {
      const fee = { ...(p[selected.id] || INIT_FEES(selected)) }
      fee.stationary = fee.stationary.filter(s => s.id !== id)
      fee.remaining  = calcRemaining(fee)
      return { ...p, [selected.id]: fee }
    })
  }

  const saveFee = () => {
    toast('Fee record saved!', 'success')
  }

  const handlePDF = async () => {
    if (!receiptRef.current) return
    const canvas = await html2canvas(receiptRef.current, { scale: 2 })
    const pdf    = new jsPDF('p', 'mm', 'a5')
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 148, 210)
    pdf.save(`Receipt-${generateReceiptNo()}.pdf`)
    toast('PDF downloaded!', 'success')
  }

  const handleWhatsApp = () => {
    const fee = getFee(selected?.id)
    if (!selected || !fee) return
    const msg = feeReminderMsg(selected, fee.remaining, new Date().toLocaleString('default', { month: 'long' }))
    window.open(buildWhatsAppLink(selected.fatherCell, msg), '_blank')
  }

  const fee        = selected ? getFee(selected.id) : null
  const paidMonths = fee ? ACTIVE_MONTHS.filter(m => fee.months[m]?.status !== 'unpaid') : []
  const totalPaid  = fee ? (
    paidMonths.reduce((a, m) => a + (Number(fee.months[m]?.paid) || 0), 0) +
    (fee.paperFund?.status !== 'unpaid' ? Number(fee.paperFund?.paid) || 0 : 0) +
    (fee.stationary || []).reduce((a, s) => a + (s.total || 0), 0)
  ) : 0

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Fee Collection" sub={`Active months: Feb → ${ACTIVE_MONTHS[ACTIVE_MONTHS.length - 1]} (${ACTIVE_MONTHS.length} months)`} />

      {/* Search */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {[['name','By Name'],['admission','Admission#'],['family','Family#'],['cell','Cell#']].map(([k,l]) => (
              <button key={k} onClick={() => setSearchBy(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${searchBy===k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={16}/></span>
            <input value={query} onChange={e => { setQuery(e.target.value); if (selected && e.target.value !== selected.name) setSelected(null) }}
              placeholder={`Search ${searchBy}…`}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"/>
          </div>
        </div>

        {/* Dropdown */}
        {query && !selected && filtered.length > 0 && (
          <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            {filtered.slice(0,6).map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 text-left">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{s.name[0]}</div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.class} • {s.admission} • {s.fatherCell}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Student card */}
      {selected && fee && (
        <>
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {selected.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500">S/O {selected.father}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge color="blue">{selected.class}</Badge>
                    <Badge color="gray">{selected.admission}</Badge>
                    <Badge color="gray">{selected.kinship}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Btn onClick={() => setReceiptOpen(true)} variant="success" icon="receipt">Generate Receipt</Btn>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Remaining Balance</div>
                  <div className="text-2xl font-bold font-mono-num text-red-600">{formatRs(fee.remaining)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Feb → {ACTIVE_MONTHS[ACTIVE_MONTHS.length-1]}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
              {[['Admission#',selected.admission],['Family#',selected.family],['Father Cell',selected.fatherCell],['Kinship',selected.kinship]].map(([l,v]) => (
                <div key={l}>
                  <div className="text-xs text-slate-400 mb-0.5">{l}</div>
                  <div className="text-sm font-semibold text-slate-800">{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Notes" value={fee.notes||''} onChange={v => setFeeData(p => ({...p,[selected.id]:{...p[selected.id],notes:v}}))} placeholder="Any notes…" rows={2}/>
              <div className="flex items-end">
                <Btn onClick={saveFee} variant="primary" icon="save" className="w-full justify-center">Save Record</Btn>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[['monthly','Monthly Fees'],['paperfund','Paper Fund'],['stationary','Stationary']].map(([k,l]) => (
              <button key={k} onClick={() => setActiveTab(k)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab===k ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Monthly fees */}
          {activeTab === 'monthly' && (
            <>
              <div className="text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
                <Icon name="alert" size={15} className="text-blue-500"/>
                Showing <strong>{ACTIVE_MONTHS.length} months</strong> (Feb → {ACTIVE_MONTHS[ACTIVE_MONTHS.length-1]}) — only months up to today are counted in remaining balance.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ACTIVE_MONTHS.map(month => {
                  const m = fee.months[month] || { agreed: selected.monthlyFee, paid: 0, status: 'unpaid' }
                  const color = statusColor[m.status]
                  return (
                    <Card key={month} className={`!p-4 border-l-4 ${color==='green'?'border-l-emerald-400':color==='amber'?'border-l-amber-400':'border-l-red-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-800">{month}</span>
                        <Badge color={color}>{m.status.toUpperCase()}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">Agreed: <span className="font-mono-num font-semibold text-slate-700">{formatRs(m.agreed)}</span></div>
                      <input type="number" value={m.paid||''} onChange={e => updateMonth(month,'paid',e.target.value)}
                        placeholder="Amount paid" min={0} max={m.agreed}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono-num outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-2"/>
                      <div className="flex gap-1">
                        <button onClick={() => updateMonth(month,'paid',m.agreed)}
                          className="flex-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg py-1 font-semibold hover:bg-emerald-100 transition-colors">
                          Full Pay
                        </button>
                        <button onClick={() => updateMonth(month,'paid',0)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg px-2 py-1 font-semibold hover:bg-red-100 transition-colors">
                          Clear
                        </button>
                      </div>
                      {m.date && <div className="text-xs text-slate-400 mt-1.5">Paid: {m.date}</div>}
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* Paper fund */}
          {activeTab === 'paperfund' && (
            <Card className="max-w-md">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Icon name="receipt" size={18}/>Annual Paper Fund</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Agreed Amount</span>
                  <span className="font-bold font-mono-num text-slate-900">{formatRs(fee.paperFund.agreed)}</span>
                </div>
                <input type="number" value={fee.paperFund.paid||''} onChange={e => updatePaperFund('paid',e.target.value)}
                  placeholder="Payment amount"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-mono-num outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                <div className="flex gap-2">
                  <Btn onClick={() => updatePaperFund('paid',fee.paperFund.agreed)} variant="success" className="flex-1 justify-center">Full Payment</Btn>
                  <Btn onClick={saveFee} variant="primary" className="flex-1 justify-center">Save</Btn>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <Badge color={statusColor[fee.paperFund.status]}>{fee.paperFund.status.toUpperCase()}</Badge>
                </div>
                {fee.paperFund.date && <div className="text-xs text-slate-400">Paid on: {fee.paperFund.date}</div>}
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                  Unpaid portion <strong>({formatRs(Math.max(0, fee.paperFund.agreed - (Number(fee.paperFund.paid)||0)))})</strong> is included in Remaining Balance.
                </div>
              </div>
            </Card>
          )}

          {/* Stationary */}
          {activeTab === 'stationary' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Stationary Items</h3>
                <Btn onClick={addStationary} variant="primary" icon="plus" size="sm">Add Item</Btn>
              </div>
              {(!fee.stationary || fee.stationary.length === 0)
                ? <Empty icon="stationary" title="No stationary items" sub="Click Add Item to add stationary"/>
                : (
                  <div className="flex flex-col gap-3">
                    {fee.stationary.map((s, idx) => (
                      <div key={s.id} className="grid grid-cols-5 gap-3 items-end">
                        <Input label={idx===0?'Item':''} value={s.item} onChange={v => updateStationary(s.id,'item',v)} placeholder="Item name" className="col-span-2"/>
                        <Input label={idx===0?'Qty':''} value={s.qty} onChange={v => updateStationary(s.id,'qty',v)} type="number"/>
                        <Input label={idx===0?'Price (Rs)':''} value={s.price} onChange={v => updateStationary(s.id,'price',v)} type="number"/>
                        <div className="flex items-end gap-2">
                          <div className="flex-1 text-sm font-bold font-mono-num text-emerald-700 pb-2">{formatRs(s.total)}</div>
                          <button onClick={() => removeStationary(s.id)} className="text-red-400 hover:text-red-600 pb-2 transition-colors"><Icon name="trash" size={16}/></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-100 items-center">
                      <span className="text-xs text-slate-500">Stationary amount is added to Remaining Balance</span>
                      <div className="text-sm font-bold text-slate-700">Total: <span className="font-mono-num text-emerald-700">{formatRs(fee.stationary.reduce((a,s)=>a+s.total,0))}</span></div>
                    </div>
                  </div>
                )
              }
            </Card>
          )}

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Total Paid',       value: formatRs(totalPaid),    color:'text-emerald-700', bg:'bg-emerald-50 border-emerald-200' },
              { label:'Remaining',        value: formatRs(fee.remaining), color:'text-red-600',     bg:'bg-red-50 border-red-200' },
              { label:'Months Covered',   value: `${paidMonths.length}/${ACTIVE_MONTHS.length}`, color:'text-blue-700', bg:'bg-blue-50 border-blue-200' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 text-center ${item.bg}`}>
                <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                <div className={`font-bold font-mono-num text-lg ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!selected && (
        <Empty icon="search" title="Search for a student" sub="Use the search bar above to find a student and manage their fees"/>
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
                      <td className="border border-slate-200 px-3 py-1.5">Stationary: {s.item} (×{s.qty})</td>
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
                <span>Period: Feb → {ACTIVE_MONTHS[ACTIVE_MONTHS.length-1]}</span>
                <span>KINS SCHOOL — Gujranwala</span>
              </div>
            </div>

            <div className="flex gap-3 mt-4 no-print">
              <Btn onClick={() => window.print()} variant="ghost" icon="print">Print</Btn>
              <Btn onClick={handlePDF} variant="primary" icon="download">Download PDF</Btn>
              <Btn onClick={handleWhatsApp} variant="whatsapp" icon="whatsapp">WhatsApp</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
