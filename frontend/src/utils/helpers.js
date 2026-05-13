// ── Date helpers ────────────────────────────────────────
export const today = () => new Date().toLocaleDateString('en-GB')
export const nowISO = () => new Date().toISOString()
export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
export const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
export const currentMonth = () => new Date().toLocaleString('en-GB', { month: 'long' })
export const currentYear  = () => new Date().getFullYear()
export const isToday10th  = () => new Date().getDate() === 10

// ── Currency ────────────────────────────────────────────
export const formatRs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`

// ── Receipt number ──────────────────────────────────────
export const generateReceiptNo = () => {
  const ts = Date.now().toString().slice(-6)
  return `KS-${new Date().getFullYear()}-${ts}`
}

// ── Grade calculator ────────────────────────────────────
export const getGrade = (pct) => {
  if (pct >= 90) return { grade: 'A+', label: 'Excellent' }
  if (pct >= 80) return { grade: 'A',  label: 'Very Good' }
  if (pct >= 70) return { grade: 'B+', label: 'Good' }
  if (pct >= 60) return { grade: 'B',  label: 'Satisfactory' }
  if (pct >= 50) return { grade: 'C',  label: 'Average' }
  if (pct >= 40) return { grade: 'D',  label: 'Below Average' }
  return { grade: 'F', label: 'Fail' }
}

// ── WhatsApp link builder ───────────────────────────────
export const buildWhatsAppLink = (phone, message) => {
  const clean = phone.replace(/[^0-9]/g, '').replace(/^0/, '92')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

// ── Fee reminder messages ───────────────────────────────
export const feeReminderMsg = (student, amount, month) =>
  `Assalam-o-Alaikum,\n\nDear Parent of *${student.name}*,\n\nThis is a gentle reminder that the school fee for *${month}* amounting to *${formatRs(amount)}* is still pending.\n\nKindly pay at your earliest convenience.\n\nRegards,\n*KINS SCHOOL*\nRatta Rd, Kins St, Gujranwala`

export const defaulterMsg = (student, months, amount) =>
  `Assalam-o-Alaikum,\n\nDear Parent of *${student.name}* (${student.class}),\n\nYour child's fee for the following months is overdue:\n*${months.join(', ')}*\n\nTotal Pending: *${formatRs(amount)}*\n\nPlease visit the school office immediately.\n\nRegards,\n*KINS SCHOOL*\nRatta Rd, Kins St, Gujranwala`

export const admissionMsg = (student) =>
  `Assalam-o-Alaikum,\n\nDear *${student.father}*,\n\nWe are pleased to confirm the admission of *${student.name}* in *${student.class}*.\n\nAdmission #: *${student.admission}*\nMonthly Fee: *${formatRs(student.monthlyFee)}*\n\nWelcome to KINS SCHOOL family! 🎓\n\nRegards,\n*KINS SCHOOL*\nRatta Rd, Kins St, Gujranwala`

export const resultMsg = (student, pct, grade) =>
  `Assalam-o-Alaikum,\n\nDear Parent of *${student.name}*,\n\nResult has been announced.\n\nPercentage: *${pct}%*\nGrade: *${grade}*\n\nCongratulations! 🌟\n\nRegards,\n*KINS SCHOOL*`

export const birthdayMsg = (student) =>
  `🎂 Happy Birthday *${student.name}*!\n\nWishing you a wonderful day filled with joy and happiness.\n\nBest Wishes,\n*KINS SCHOOL Family* 🎓`

// ── Months list (Feb → Jan school year) ─────────────────
export const SCHOOL_MONTHS = [
  'February','March','April','May','June','July',
  'August','September','October','November','December','January'
]

// ── Classes list ─────────────────────────────────────────
export const CLASSES = [
  'Play Group','Nursery','Prep','Class 1','Class 2','Class 3',
  'Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'
]

// ── Download blob helper ─────────────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Export table to CSV ──────────────────────────────────
export const exportCSV = (data, filename) => {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadBlob(blob, filename)
}
