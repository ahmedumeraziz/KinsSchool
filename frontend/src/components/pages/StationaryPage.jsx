import React, { useState } from 'react'
import { Card, Btn, Input, Badge, Icon, Modal, PageHeader, StatCard, Empty } from '../common/UI'
import { formatRs, exportCSV } from '../../utils/helpers'

const INIT_INVENTORY = [
  { id: 1, name: 'Notebooks (Single Line)', category: 'Notebooks', stock: 150, price: 50,  sold: 45, unit: 'pcs' },
  { id: 2, name: 'Notebooks (Double Line)', category: 'Notebooks', stock: 120, price: 50,  sold: 30, unit: 'pcs' },
  { id: 3, name: 'Graph Notebooks',         category: 'Notebooks', stock: 80,  price: 60,  sold: 20, unit: 'pcs' },
  { id: 4, name: 'Blue Pen (Ink)',           category: 'Pens',     stock: 200, price: 20,  sold: 88, unit: 'pcs' },
  { id: 5, name: 'Black Pen (Ink)',          category: 'Pens',     stock: 180, price: 20,  sold: 65, unit: 'pcs' },
  { id: 6, name: 'Pencil (HB)',              category: 'Pencils',  stock: 300, price: 10,  sold: 120, unit: 'pcs' },
  { id: 7, name: 'Eraser',                  category: 'Supplies', stock: 250, price: 10,  sold: 90, unit: 'pcs' },
  { id: 8, name: 'Ruler (30cm)',            category: 'Supplies', stock: 100, price: 30,  sold: 35, unit: 'pcs' },
  { id: 9, name: 'Geometry Box',            category: 'Supplies', stock: 60,  price: 150, sold: 28, unit: 'pcs' },
  { id: 10, name: 'Color Pencils Set',      category: 'Art',      stock: 45,  price: 120, sold: 18, unit: 'set' },
]

const SALES_LOG = [
  { id: 1, student: 'Ahmed Raza',   item: 'Notebooks (3pcs)',   qty: 3, amount: 150, date: '2024-04-10' },
  { id: 2, student: 'Sara Malik',   item: 'Blue Pen (5pcs)',    qty: 5, amount: 100, date: '2024-04-11' },
  { id: 3, student: 'Usman Ali',    item: 'Geometry Box',      qty: 1, amount: 150, date: '2024-04-12' },
  { id: 4, student: 'Fatima Khan',  item: 'Color Pencils Set', qty: 1, amount: 120, date: '2024-04-13' },
]

const CATS = ['All', 'Notebooks', 'Pens', 'Pencils', 'Supplies', 'Art']
const EMPTY = { name: '', category: 'Notebooks', stock: '', price: '', unit: 'pcs' }

export default function StationaryPage({ toast }) {
  const [inventory, setInventory] = useState(INIT_INVENTORY)
  const [sales]                   = useState(SALES_LOG)
  const [catFilter, setCat]       = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [tab, setTab]             = useState('inventory')
  const [restockId, setRestockId] = useState(null)
  const [restockQty, setRestockQty] = useState('')

  const filtered = inventory.filter(i => catFilter === 'All' || i.category === catFilter)

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setModalOpen(true) }

  const saveItem = () => {
    if (!form.name || !form.price) { toast('Name and price are required.', 'error'); return }
    if (editItem) {
      setInventory(p => p.map(i => i.id === editItem.id ? { ...i, ...form } : i))
      toast('Item updated!', 'success')
    } else {
      setInventory(p => [...p, { ...form, id: Date.now(), sold: 0, stock: Number(form.stock) || 0, price: Number(form.price) || 0 }])
      toast('Item added!', 'success')
    }
    setModalOpen(false)
  }

  const deleteItem = (id) => {
    setInventory(p => p.filter(i => i.id !== id))
    toast('Item removed.', 'warn')
  }

  const restock = (id) => {
    if (!restockQty || isNaN(restockQty)) { toast('Enter valid quantity.', 'error'); return }
    setInventory(p => p.map(i => i.id === id ? { ...i, stock: i.stock + Number(restockQty) } : i))
    toast(`Restocked ${restockQty} units!`, 'success')
    setRestockId(null); setRestockQty('')
  }

  const totalRevenue = sales.reduce((a, s) => a + s.amount, 0)
  const totalStock   = inventory.reduce((a, i) => a + i.stock, 0)
  const lowStock     = inventory.filter(i => i.stock < 20).length

  const set = (field) => (val) => setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Stationary Shop" sub="Manage stationary inventory and track sales">
        <Btn onClick={() => exportCSV(inventory, 'Inventory.csv')} variant="ghost" icon="excel" size="sm">Export</Btn>
        <Btn onClick={openAdd} variant="primary" icon="plus">Add Item</Btn>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={inventory.length.toString()} icon="stationary" color="blue" />
        <StatCard title="Total Stock" value={totalStock.toLocaleString()} icon="save" color="green" sub="units in hand" />
        <StatCard title="Low Stock Alert" value={lowStock.toString()} icon="alert" color={lowStock > 0 ? 'amber' : 'green'} sub="< 20 units" />
        <StatCard title="Sales Revenue" value={formatRs(totalRevenue)} icon="fee" color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['inventory','Inventory'],['sales','Sales Log']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === k ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'inventory' && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${catFilter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Low stock alert */}
          {lowStock > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
              <span className="text-xl">⚠️</span>
              <span className="text-amber-800"><strong>{lowStock} item(s)</strong> are running low (less than 20 units). Please restock soon.</span>
            </div>
          )}

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Item Name','Category','Stock','Unit Price','Sold','Revenue','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={8}><Empty icon="stationary" title="No items found" /></td></tr>
                    : filtered.map(item => {
                      const isLow = item.stock < 20
                      return (
                        <tr key={item.id} className="table-row border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-4 py-3"><Badge color="blue">{item.category}</Badge></td>
                          <td className="px-4 py-3">
                            {restockId === item.id ? (
                              <div className="flex items-center gap-1">
                                <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Qty" className="w-16 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500" />
                                <button onClick={() => restock(item.id)} className="text-xs text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded hover:bg-emerald-100">✓</button>
                                <button onClick={() => { setRestockId(null); setRestockQty('') }} className="text-xs text-slate-400 px-1">✕</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`font-bold font-mono-num ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{item.stock}</span>
                                <span className="text-xs text-slate-400">{item.unit}</span>
                                <button onClick={() => setRestockId(item.id)} className="text-xs text-blue-500 hover:text-blue-700 font-semibold ml-1">+</button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono-num text-slate-700">{formatRs(item.price)}</td>
                          <td className="px-4 py-3 font-mono-num text-emerald-700">{item.sold}</td>
                          <td className="px-4 py-3 font-mono-num font-bold text-emerald-700">{formatRs(item.sold * item.price)}</td>
                          <td className="px-4 py-3"><Badge color={isLow ? 'red' : 'green'}>{isLow ? 'Low Stock' : 'In Stock'}</Badge></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Icon name="edit" size={14} /></button>
                              <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Icon name="trash" size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'sales' && (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['#','Student','Item','Qty','Amount','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id} className="table-row border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-400 font-mono-num text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.student}</td>
                    <td className="px-4 py-3 text-slate-600">{s.item}</td>
                    <td className="px-4 py-3 font-mono-num">{s.qty}</td>
                    <td className="px-4 py-3 font-bold font-mono-num text-emerald-700">{formatRs(s.amount)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.date}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                  <td colSpan={4} className="px-4 py-3 font-bold text-emerald-800">TOTAL REVENUE</td>
                  <td className="px-4 py-3 font-bold font-mono-num text-emerald-700">{formatRs(totalRevenue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Item' : 'Add Stationary Item'} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Item Name" value={form.name} onChange={set('name')} placeholder="e.g. Notebook (Single Line)" required />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e => set('category')(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
                {CATS.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</label>
              <select value={form.unit} onChange={e => set('unit')(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
                {['pcs','set','box','dozen','pack'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Stock" value={form.stock} onChange={set('stock')} type="number" placeholder="0" />
            <Input label="Unit Price (Rs)" value={form.price} onChange={set('price')} type="number" placeholder="0" required />
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <Btn onClick={() => setModalOpen(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveItem} variant="primary" icon="save">{editItem ? 'Update' : 'Add Item'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
