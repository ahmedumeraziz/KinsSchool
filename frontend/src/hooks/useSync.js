import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { db, getSyncQueue, clearSyncQueue } from '../utils/db'
import * as api from '../utils/api'

export function useSync() {
  // Use refs so interval never causes re-renders
  const syncingRef    = useRef(false)
  const mountedRef    = useRef(true)
  const { setSyncing, setLastSynced, setStudents } = useAppStore()

  useEffect(() => {
    mountedRef.current = true

    const apiUrl = import.meta.env.VITE_API_URL
    // If no backend configured — do nothing at all
    if (!apiUrl || apiUrl === '' || apiUrl === 'http://localhost:8000') {
      return
    }

    const syncDown = async () => {
      if (syncingRef.current || !mountedRef.current) return
      syncingRef.current = true
      if (mountedRef.current) setSyncing(true)
      try {
        const res = await api.getStudents()
        if (!mountedRef.current) return
        if (res?.data?.students?.length) {
          setStudents(res.data.students)
          // Write to IndexedDB silently
          try {
            await db.students.clear()
            await db.students.bulkAdd(res.data.students)
          } catch { /* ignore db errors */ }
        }
        if (mountedRef.current) setLastSynced(new Date().toISOString())
      } catch {
        // Backend down or offline — silent fail, use local data
      } finally {
        syncingRef.current = false
        if (mountedRef.current) setSyncing(false)
      }
    }

    const syncUp = async () => {
      if (!mountedRef.current) return
      let queue = []
      try { queue = await getSyncQueue() } catch { return }
      if (!queue.length) return
      try {
        for (const item of queue) {
          if (!mountedRef.current) break
          try {
            if (item.action === 'create' && item.table === 'students')
              await api.createStudent(item.data)
            else if (item.action === 'update' && item.table === 'students')
              await api.updateStudentR(item.data.id, item.data)
            else if (item.action === 'delete' && item.table === 'students')
              await api.deleteStudentR(item.data.id)
            else if (item.action === 'create' && item.table === 'fees')
              await api.saveFee(item.data)
          } catch { /* skip individual failures */ }
        }
        await clearSyncQueue()
      } catch { /* keep queue for next cycle */ }
    }

    // First sync after 5 seconds — give app time to fully load
    const firstTimer = setTimeout(syncDown, 5000)

    // Then sync every 30 seconds (not 10 — 10 was too aggressive)
    const interval = setInterval(async () => {
      await syncUp()
      await syncDown()
    }, 30000)

    return () => {
      mountedRef.current = false
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps — run once on mount only, never re-run

  // Return nothing — callers don't need to trigger sync manually
  return {}
}
