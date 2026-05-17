import React, { useState, useEffect, useCallback } from 'react'
import { Card, Btn, Input, Badge, Icon, Modal, PageHeader, Empty, Skeleton } from '../common/UI'
import { useAppStore } from '../../store/appStore'
import { formatRs } from '../../utils/helpers'
import { saveToBackend, getQueueCount } from '../../utils/syncService'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const EMPTY_ITEM = { name: '', category: '', stock: 0, price: 0, unit: 'pcs', sold: 0 }

export default function StationaryPage({ toast }) {
  const { inventory, setInventory, token } = useAppStore()

  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [tab, setTab]                 = useState('inventory')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editItem, setEditItem]       = useState(null)
  const [form, setForm]               = useState(EMPTY_ITEM)
  const [sellOpen, setSellOpen]       = useState(false)
  const [sellItem, setSellItem]       = useState(null)
  const [sellQty, setSellQty]         = useState(1)
  const [sellSaving, setSellSaving]   = useState(false)
  const [salesLog, setSalesLog]       = useState([])
  const [delConfirm, setDelConfirm]   = useState(null)

  // ── Fetch inventory from backend ──────────────────────────
  const fetchInventory = useCallback(async () => {
    if (!API_URL || !token || token === 'demo-token-offline') return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/stationary`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.inventory?.length) setInventory(data.inventory)
      }
    } catch { /* use local */ }
    finally { setLoading(false) }
  }, [token, setInventory])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  // ── Save item (add or edit) ───────────────────────────────
  const saveItem = async () => {
    if (!form.name || !form.price) { toast('Name and price are required.', 'error'); return }
    setSaving(true)
    try {
      const isEdit = !!editItem
      const item   = isEdit
        ? { ...editItem, ...form, stock: Number(form.stock)||0, price: Number(form.price)||0 }
        : { ...form, id: Date.now(), stock: Number(form.stock)||0, price: Number(form.price)||0, sold: 0 }

      // Update local store
      if (isEdit) {
        setInventory(inventory.map(i => i.id === editItem.id ? item : i))
      } else {
        setInventory([...inventory, item])
      }

      // Sync to backend/Sheets
      const result = isEdit
        ? await saveToBackend(`/api/stationary/${item.id}`, item, 'PUT')
        : await saveToBackend('/api/stationary', item, 'POST')

      if (result.ok)     toast('✅ Saved to Google Sheets!', 'success')
      else if (result.queued) toast('💾 Saved locally. Will sync when online.', 'warn')

      setModalOpen(false)
      setEditItem(null)
      setForm(EMPTY_ITEM)
    } finally { setSaving(false) }
  }

  // ── Quick sell (no student name) ─────────────────────────
  const handleQuickSell = async () => {
    if (!sellItem) return
    const qty = Number(sellQty) || 1
    if (qty <= 0) { toast('Enter valid quantity.', 'error'); return }
    if (qty > (sellItem.stock || 0)) { toast(`Only ${sellItem.stock} in stock.`, 'error'); return }
    setSellSaving(true)
    try {
      const updated = { ...sellItem, stock: sellItem.stock - qty, sold: (sellItem.sold||0) + qty }
      setInventory(inventory.map(i => i.id === sellItem.id ? updated : i))

      const logEntry = {
        id:       Date.now(),
        itemId:   sellItem.id,
        item:     sellItem.name,
        qty,
        price:    sellItem.price,
        total:    qty * sellItem.price,
        date:     new Date().toLocaleDateString('en-GB'),
        time:     new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        type:     'quick-sell',
        student:  '—',
      }
      setSalesLog(p => [logEntry, ...p])

      const result = await saveToBackend(`/api/stationary/${sellItem.id}`, updated, 'PUT')
      if (result.ok) toast(`✅ Sold ${qty} × ${sellItem.name} — Stock: ${updated.stock} left`, 'success')
      else toast('💾 Stock updated locally.', 'warn')

      setSellOpen(false)
      setSellItem(null)
      setSellQty(1)
    } finally { setSellSaving(false) }
  }

  // ── Adjust stock (+ / -) ──────────────────────────────────
  const adjustStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stock||0) + delta)
    const updated  = { ...item, stock: newStock }
    setInventory(inventory.map(i => i.id === item.id ? updated : i))
    const result = await saveToBackend(`/api/stationary/${item.id}`, updated, 'PUT')
    if (!result.ok && !result.queued) toast('Stock update queued.', 'warn')
  }

  // ── Delete item (marks as delivered/cleared, reduces stock to 0) ──
  const confirmDelete = async () => {
    const item    = delConfirm
    const updated = { ...item, stock: 0, delivered: true, deliveredAt: new Date().toISOString() }
    setInventory(inventory.map(i => i.id === item.id ? updated : i))

    const logEntry = {
      id:      Date.now(),
      itemId:  item.id,
      item:    item.name,
      qty:     item.stock,
      price:   item.price,
      total:   item.stock * item.price,
      date:    new Date().toLocaleDateString('en-GB'),
      time:    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      type:    'delivered',
      student: '—',
    }
    setSalesLog(p => [logEntry, ...p])

    await saveToBackend(`/api/stationary/${item.id}`, updated, 'PUT')
    toast(`✅ ${item.name} marked as delivered. Stock cleared.`, 'success')
    setDelConfirm(null)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ ...item })
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_ITEM)
    setModalOpen(true)
  }

  const openSell = (item) => {
    setSellItem(item)
    setSellQty(1)
    setSellOpen(true)
  }

  const set = (field) => (val) => setForm(p => ({ ...p, [field]: val }))

  const totalItems   = inventory.length
  const totalStock   = inventory.reduce((a, i) => a + (Number(i.stock)||0), 0)
  const totalValue   = inventory.reduce((a, i) => a + (Number(i.stock)||0) * (Number(i.price)||0), 0)
  const lowStockItems= inventory.filter(i => (Number(i.stock)||0) < 10 && !i.delivered)
  const totalSales   = salesLog.reduce((a, l) => a + l.total, 0)

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-up">
      <PageHeader title="Stationary" sub="Manage inventory and track sales">
        <div className="flex gap-2">
          {getQueueCount() > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Icon name="sync" size={13}/>{getQueueCount()} pending sync
            </div>
          )}
          <Btn onClick={fetchInventory} variant="ghost" icon="sync" size="sm" disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Btn>
          <Btn onClick={openAdd} variant="primary" icon="plus">Add Item</Btn>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Items',  value: totalItems,          color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'    },
          { label: 'Total Stock',  value: `${totalStock} pcs`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Stock Value',  value: formatRs(totalValue),color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200'  },
          { label: 'Sales Today',  value: formatRs(totalSales),color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200'},
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`font-bold font-mono-num text-lg ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-xl">⚠️</span>
          <span className="text-amber-800">
            <strong>{lowStockItems.length} item(s)</strong> running low (under 10 units):&nbsp;
            {lowStockItems.map(i => i.name).join(', ')}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['inventory','Inventory'],['log','Sales Log']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===k ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
            {k === 'log' && salesLog.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{salesLog.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <Card className="!p-0 overflow-hidden">
          {loading ? (
            <div className="p-6"><Skeleton rows={5}/></div>
          ) : inventory.length === 0 ? (
            <div className="p-6"><Empty icon="stationary" title="No items yet" sub="Click Add Item to add your first stationary item"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Item Name','Category','Stock','Unit Price','Stock Value','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, i) => {
                    const stock    = Number(item.stock) || 0
                    const price    = Number(item.price) || 0
                    const isLow    = stock < 10 && !item.delivered
                    const isDone   = item.delivered
                    return (
                      <tr key={item.id || i} className="table-row border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="px-4 py-3">
                          <Badge color="blue">{item.category || '—'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {isDone ? (
                            <Badge color="gray">Delivered</Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => adjustStock(item, -1)}
                                className="w-6 h-6 rounded bg-red-50 text-red-500 border border-red-200 flex items-center justify-center font-bold hover:bg-red-100 transition-colors text-xs">
                                −
                              </button>
                              <span className={`font-bold font-mono-num w-8 text-center ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                                {stock}
                              </span>
                              <button onClick={() => adjustStock(item, 1)}
                                className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold hover:bg-emerald-100 transition-colors text-xs">
                                +
                              </button>
                              <span className="text-xs text-slate-400">{item.unit||'pcs'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono-num text-slate-700">{formatRs(price)}</td>
                        <td className="px-4 py-3 font-mono-num font-bold text-emerald-700">
                          {isDone ? '—' : formatRs(stock * price)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={isDone ? 'gray' : isLow ? 'red' : 'green'}>
                            {isDone ? 'Delivered' : isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!isDone && (
                              <>
                                <button onClick={() => openSell(item)} title="Quick Sell"
                                  className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors text-xs font-bold">
                                  Sell
                                </button>
                                <button onClick={() => openEdit(item)} title="Edit"
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Icon name="edit" size={14}/>
                                </button>
                              </>
                            )}
                            <button onClick={() => setDelConfirm(item)} title="Mark as Delivered"
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors text-xs">
                              ✓ Deliver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Sales Log Tab */}
      {tab === 'log' && (
        <Card className="!p-0 overflow-hidden">
          {salesLog.length === 0 ? (
            <div className="p-6"><Empty icon="receipt" title="No sales recorded yet" sub="Sales appear here after selling items"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['#','Item','Qty','Unit Price','Total','Type','Date & Time'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesLog.map((l, i) => (
                    <tr key={l.id} className="table-row border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono-num">{i+1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{l.item}</td>
                      <td className="px-4 py-3 font-mono-num">{l.qty}</td>
                      <td className="px-4 py-3 font-mono-num text-slate-600">{formatRs(l.price)}</td>
                      <td className="px-4 py-3 font-bold font-mono-num text-emerald-700">{formatRs(l.total)}</td>
                      <td className="px-4 py-3">
                        <Badge color={l.type === 'delivered' ? 'amber' : 'green'}>
                          {l.type === 'delivered' ? 'Delivered' : 'Quick Sell'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{l.date} {l.time}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td colSpan={4} className="px-4 py-2 font-bold text-emerald-800">TOTAL SALES</td>
                    <td className="px-4 py-2 font-bold font-mono-num text-emerald-700">{formatRs(totalSales)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); setForm(EMPTY_ITEM) }}
        title={editItem ? `Edit — ${editItem.name}` : 'Add Stationary Item'} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Item Name" value={form.name} onChange={set('name')} placeholder="e.g. Notebook Single Line" required/>
          <Input label="Category (editable)" value={form.category} onChange={set('category')} placeholder="e.g. Notebooks, Pens, Art Supplies…"/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock Quantity" value={form.stock} onChange={set('stock')} type="number" placeholder="0"/>
            <Input label="Unit Price (Rs)" value={form.price} onChange={set('price')} type="number" placeholder="0" required/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</label>
            <select value={form.unit||'pcs'} onChange={e => set('unit')(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
              {['pcs','set','box','dozen','pack','kg','ltr'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          {form.price && form.stock ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
              <span className="text-slate-500">Stock Value: </span>
              <span className="font-bold font-mono-num text-emerald-700">
                {formatRs((Number(form.stock)||0) * (Number(form.price)||0))}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <Btn onClick={() => { setModalOpen(false); setEditItem(null); setForm(EMPTY_ITEM) }} variant="ghost">Cancel</Btn>
          <Btn onClick={saveItem} variant="primary" icon="save" disabled={saving}>
            {saving ? '⏳ Saving…' : editItem ? '💾 Update Item' : '💾 Add Item'}
          </Btn>
        </div>
      </Modal>

      {/* Quick Sell Modal */}
      <Modal open={sellOpen} onClose={() => { setSellOpen(false); setSellItem(null); setSellQty(1) }}
        title="Quick Sell" size="sm">
        {sellItem && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="font-bold text-slate-900">{sellItem.name}</div>
              <div className="text-sm text-slate-500 mt-1">
                In Stock: <span className="font-bold font-mono-num text-slate-800">{sellItem.stock} {sellItem.unit||'pcs'}</span>
                &nbsp;•&nbsp;Price: <span className="font-bold font-mono-num text-blue-700">{formatRs(sellItem.price)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity to Sell</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSellQty(q => Math.max(1, q-1))}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center font-bold hover:bg-red-100 transition-colors text-lg">
                  −
                </button>
                <input type="number" value={sellQty} onChange={e => setSellQty(Math.max(1, Number(e.target.value)||1))}
                  min={1} max={sellItem.stock}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-mono-num outline-none focus:border-blue-500"/>
                <button onClick={() => setSellQty(q => Math.min(sellItem.stock, q+1))}
                  className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold hover:bg-emerald-100 transition-colors text-lg">
                  +
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex justify-between">
              <span className="text-slate-600">Total Amount</span>
              <span className="font-bold font-mono-num text-blue-700 text-lg">
                {formatRs(sellQty * (sellItem.price||0))}
              </span>
            </div>
            <div className="text-xs text-slate-400 text-center">
              Stock after sale: <strong>{Math.max(0, (sellItem.stock||0) - sellQty)} {sellItem.unit||'pcs'}</strong>
            </div>

            <div className="flex gap-3 justify-end">
              <Btn onClick={() => { setSellOpen(false); setSellItem(null); setSellQty(1) }} variant="ghost">Cancel</Btn>
              <Btn onClick={handleQuickSell} variant="success" icon="save" disabled={sellSaving}>
                {sellSaving ? 'Selling…' : `Sell ${sellQty} ${sellItem.unit||'pcs'}`}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Deliver Confirm Modal */}
      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Mark as Delivered" size="sm">
        {delConfirm && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="font-bold text-slate-900">{delConfirm.name}</div>
              <div className="text-sm text-amber-700 mt-1">
                Current Stock: <strong>{delConfirm.stock} {delConfirm.unit||'pcs'}</strong>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Marking as <strong>Delivered</strong> means the student has cleared this item from their account.
              Stock will be set to 0. This does <strong>NOT</strong> increase stock — it means the item was delivered/cleared.
            </p>
            <div className="flex gap-3 justify-end">
              <Btn onClick={() => setDelConfirm(null)} variant="ghost">Cancel</Btn>
              <Btn onClick={confirmDelete} variant="amber" icon="check">Mark as Delivered</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
