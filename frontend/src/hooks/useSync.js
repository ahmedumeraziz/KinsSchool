import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { db, getSyncQueue, clearSyncQueue } from '../utils/db'
import * as api from '../utils/api'

export function useSync() {
  const { setSyncing, setLastSynced, setStudents } = useAppStore()

  const syncDown = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl || apiUrl === 'http://localhost:8000') return
    try {
      setSyncing(true)
      const res = await api.getStudents()
      if (res?.data?.students?.length) {
        setStudents(res.data.students)
        await db.students.clear()
        await db.students.bulkAdd(res.data.students)
      }
      setLastSynced(new Date().toISOString())
    } catch {
      // Offline — use local data silently
    } finally {
      setSyncing(false)
    }
  }, [setSyncing, setLastSynced, setStudents])

  const syncUp = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl || apiUrl === 'http://localhost:8000') return
    const queue = await getSyncQueue()
    if (!queue.length) return
    try {
      setSyncing(true)
      for (const item of queue) {
        try {
          if (item.action === 'create' && item.table === 'students') await api.createStudent(item.data)
          else if (item.action === 'update' && item.table === 'students') await api.updateStudentR(item.data.id, item.data)
          else if (item.action === 'delete' && item.table === 'students') await api.deleteStudentR(item.data.id)
          else if (item.action === 'create' && item.table === 'fees') await api.saveFee(item.data)
        } catch { /* skip failed items */ }
      }
      await clearSyncQueue()
    } catch { /* keep queue */ } finally {
      setSyncing(false)
    }
  }, [setSyncing])

  useEffect(() => {
    const interval = parseInt(import.meta.env.VITE_SYNC_INTERVAL || '10000')
    const firstSync = setTimeout(() => syncDown(), 3000)
    const t = setInterval(() => { syncUp(); syncDown() }, interval)
    return () => { clearTimeout(firstSync); clearInterval(t) }
  }, [syncDown, syncUp])

  return { syncDown, syncUp }
}
