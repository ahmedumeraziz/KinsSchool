/**
 * syncService.js
 * Handles all data saving to Google Sheets via backend.
 * If offline — queues the action and retries when online.
 */

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const QUEUE_KEY = 'kins-sync-queue'

// ── Queue helpers ─────────────────────────────────────────
const getQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}
const saveQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
const addToQueue = (item) => {
  const q = getQueue()
  q.push({ ...item, queuedAt: new Date().toISOString(), id: Date.now() })
  saveQueue(q)
}
const clearQueue = () => localStorage.removeItem(QUEUE_KEY)

// ── Token helper ──────────────────────────────────────────
const getToken = () => {
  try {
    const store = JSON.parse(localStorage.getItem('kins-school-store') || '{}')
    return store?.state?.token || ''
  } catch { return '' }
}

// ── Core save function ────────────────────────────────────
export const saveToBackend = async (endpoint, data, method = 'POST') => {
  const token = getToken()
  if (!API_URL || !token || token === 'demo-token-offline') {
    // No backend — store in queue only
    addToQueue({ endpoint, data, method })
    return { ok: false, queued: true }
  }

  if (!navigator.onLine) {
    // Offline — queue and return
    addToQueue({ endpoint, data, method })
    return { ok: false, queued: true, reason: 'offline' }
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      return { ok: true, data: await res.json() }
    }
    // Server error — queue for retry
    addToQueue({ endpoint, data, method })
    return { ok: false, queued: true, status: res.status }
  } catch {
    // Network error — queue for retry
    addToQueue({ endpoint, data, method })
    return { ok: false, queued: true, reason: 'network-error' }
  }
}

// ── Flush queue when back online ──────────────────────────
export const flushQueue = async () => {
  const q = getQueue()
  if (!q.length) return { flushed: 0 }
  if (!navigator.onLine) return { flushed: 0, reason: 'offline' }

  const token = getToken()
  if (!token || token === 'demo-token-offline') return { flushed: 0 }

  let flushed = 0
  const remaining = []

  for (const item of q) {
    try {
      const res = await fetch(`${API_URL}${item.endpoint}`, {
        method: item.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.data),
      })
      if (res.ok) {
        flushed++
      } else {
        remaining.push(item)
      }
    } catch {
      remaining.push(item)
    }
  }

  saveQueue(remaining)
  return { flushed, remaining: remaining.length }
}

export const getQueueCount = () => getQueue().length

// ── Specific save helpers used by pages ──────────────────

export const syncStudent = async (student, action = 'create') => {
  if (action === 'create')
    return saveToBackend('/api/students', student, 'POST')
  if (action === 'update')
    return saveToBackend(`/api/students/${student.id}`, student, 'PUT')
  if (action === 'delete')
    return saveToBackend(`/api/students/${student.id}`, {}, 'DELETE')
}

export const syncFee = async (feeData) => {
  return saveToBackend('/api/fees', feeData, 'POST')
}

export const syncResult = async (result) => {
  return saveToBackend('/api/results', result, 'POST')
}

export const syncAttendance = async (data) => {
  return saveToBackend('/api/attendance', data, 'POST')
}

export const syncReceipt = async (receipt) => {
  return saveToBackend('/api/receipts', receipt, 'POST')
}
