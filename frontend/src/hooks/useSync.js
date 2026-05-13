import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { db, getSyncQueue, clearSyncQueue } from '../utils/db'
import * as api from '../utils/api'

export function useSync() {
  const { setSyncing, setLastSynced, scriptUrl, setStudents, setFees } = useAppStore()

  const syncDown = useCallback(async () => {
    if (!scriptUrl && !import.meta.env.VITE_API_URL) return
    try {
      setSyncing(true)
      // Pull students from backend
      const res = await api.getStudents()
      if (res.data?.students) {
        setStudents(res.data.students)
        // Upsert into IndexedDB
        await db.students.clear()
        await db.students.bulkAdd(res.data.students)
      }
      setLastSynced(new Date().toISOString())
    } catch {
      // Offline — use local data silently
    } finally {
      setSyncing(false)
    }
  }, [scriptUrl, setSyncing, setLastSynced, setStudents, setFees])

  const syncUp = useCallback(async () => {
    const queue = await getSyncQueue()
    if (!queue.length) return
    try {
      setSyncing(true)
      for (const item of queue) {
        if (item.action === 'create' && item.table === 'students')
          await api.createStudent(item.data)
        else if (item.action === 'update' && item.table === 'students')
          await api.updateStudentR(item.data.id, item.data)
        else if (item.action === 'delete' && item.table === 'students')
          await api.deleteStudentR(item.data.id)
        else if (item.action === 'create' && item.table === 'fees')
          await api.saveFee(item.data)
        else if (item.action === 'create' && item.table === 'attendance')
          await api.saveAttendance(item.data)
      }
      await clearSyncQueue()
    } catch {
      // Keep in queue for next attempt
    } finally {
      setSyncing(false)
    }
  }, [setSyncing])

  useEffect(() => {
    const interval = parseInt(import.meta.env.VITE_SYNC_INTERVAL || '10000')
    syncDown()
    const t = setInterval(() => {
      syncUp()
      syncDown()
    }, interval)
    return () => clearInterval(t)
  }, [syncDown, syncUp])

  return { syncDown, syncUp }
}
