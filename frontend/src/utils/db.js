import Dexie from 'dexie'

export const db = new Dexie('KinsSchoolDB')

db.version(1).stores({
  students:   '++id, admission, family, fatherCell, class',
  fees:       '++id, studentId, month, year, status',
  receipts:   '++id, studentId, receiptNo, date',
  results:    '++id, studentId, exam, year',
  attendance: '++id, date, studentId, status',
  stationary: '++id, name',
  inventory:  '++id, name, category',
  syncQueue:  '++id, table, action, data, timestamp',
  settings:   'key',
})

// Sync queue helpers
export const addToSyncQueue = async (table, action, data) => {
  await db.syncQueue.add({ table, action, data, timestamp: new Date().toISOString() })
}

export const clearSyncQueue = async () => {
  await db.syncQueue.clear()
}

export const getSyncQueue = async () => {
  return await db.syncQueue.toArray()
}

// Seed demo data if empty
export const seedDemoData = async () => {
  const count = await db.students.count()
  if (count > 0) return

  const students = [
    { name: 'Ahmed Raza', father: 'Muhammad Raza', admission: 'KS-2024-001', family: 'FAM-001', kinship: 'Son', fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd', class: 'Class 5', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
    { name: 'Sara Malik', father: 'Tariq Malik', admission: 'KS-2024-002', family: 'FAM-002', kinship: 'Daughter', fatherCell: '0311-2345678', motherCell: '0312-2345678', address: 'House 45, Kins St', class: 'Class 3', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-01' },
    { name: 'Usman Ali', father: 'Khalid Ali', admission: 'KS-2024-003', family: 'FAM-003', kinship: 'Son', fatherCell: '0322-3456789', motherCell: '', address: 'House 78, Main Bazar', class: 'Class 7', paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-01-20' },
    { name: 'Fatima Khan', father: 'Imran Khan', admission: 'KS-2024-004', family: 'FAM-004', kinship: 'Daughter', fatherCell: '0333-4567890', motherCell: '0334-4567890', address: 'House 90, Garden Town', class: 'Class 8', paperFund: 2500, monthlyFee: 2000, admissionDate: '2024-03-10' },
    { name: 'Bilal Hassan', father: 'Asif Hassan', admission: 'KS-2024-005', family: 'FAM-001', kinship: 'Son', fatherCell: '0300-1234567', motherCell: '0301-1234567', address: 'House 12, Ratta Rd', class: 'Class 6', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-01-15' },
    { name: 'Zainab Iqbal', father: 'Naveed Iqbal', admission: 'KS-2024-006', family: 'FAM-005', kinship: 'Daughter', fatherCell: '0344-5678901', motherCell: '0345-5678901', address: 'House 23, Satellite Town', class: 'Class 4', paperFund: 2000, monthlyFee: 1500, admissionDate: '2024-02-15' },
    { name: 'Ali Hassan', father: 'Noman Hassan', admission: 'KS-2024-007', family: 'FAM-006', kinship: 'Son', fatherCell: '0355-6789012', motherCell: '', address: 'House 56, Civil Lines', class: 'Class 9', paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-10' },
    { name: 'Hina Shah', father: 'Waqas Shah', admission: 'KS-2024-008', family: 'FAM-007', kinship: 'Daughter', fatherCell: '0366-7890123', motherCell: '0367-7890123', address: 'House 89, Officers Colony', class: 'Class 10', paperFund: 3000, monthlyFee: 2500, admissionDate: '2024-01-12' },
  ]
  await db.students.bulkAdd(students)
}
