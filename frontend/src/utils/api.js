import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const store = JSON.parse(localStorage.getItem('kins-school-store') || '{}')
  const token = store?.state?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kins-school-store')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/api/auth/login', { username, password })

// ── Students ────────────────────────────────────────────
export const getStudents    = ()       => api.get('/api/students')
export const createStudent  = (data)   => api.post('/api/students', data)
export const updateStudentR = (id, d)  => api.put(`/api/students/${id}`, d)
export const deleteStudentR = (id)     => api.delete(`/api/students/${id}`)

// ── Fees ────────────────────────────────────────────────
export const getFees      = (studentId) => api.get(`/api/fees/${studentId}`)
export const saveFee      = (data)      => api.post('/api/fees', data)
export const getDefaulters = (month, year) => api.get(`/api/fees/defaulters?month=${month}&year=${year}`)

// ── Receipts ────────────────────────────────────────────
export const createReceipt = (data)  => api.post('/api/receipts', data)
export const getReceipts   = ()      => api.get('/api/receipts')

// ── Results ─────────────────────────────────────────────
export const getResults    = ()      => api.get('/api/results')
export const saveResult    = (data)  => api.post('/api/results', data)

// ── Attendance ──────────────────────────────────────────
export const saveAttendance = (data) => api.post('/api/attendance', data)
export const getAttendance  = (date) => api.get(`/api/attendance?date=${date}`)

// ── Stationary ──────────────────────────────────────────
export const getInventory    = ()     => api.get('/api/stationary')
export const saveInventory   = (data) => api.post('/api/stationary', data)

// ── Reports ─────────────────────────────────────────────
export const getReport        = (type, params) => api.get(`/api/reports/${type}`, { params })
export const downloadExcel    = (type, params) => api.get(`/api/reports/${type}/excel`, { params, responseType: 'blob' })
export const downloadPDF      = (type, params) => api.get(`/api/reports/${type}/pdf`, { params, responseType: 'blob' })

// ── Settings ────────────────────────────────────────────
export const testSheetsConnection = (url)    => api.post('/api/settings/test-sheets', { url })
export const createSheetHeaders   = (url)    => api.post('/api/settings/create-headers', { url })
export const syncWithSheets       = ()       => api.post('/api/settings/sync')

export default api
