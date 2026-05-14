import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { db, getSyncQueue, clearSyncQueue } from '../utils/db'
import * as api from '../utils/api'

// Deep equality check — only update store if data actually changed
function isEqual(a, b) {
  if (a === b) return true
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function useSync() {
  const syncingRef  = useRef(false)
  const mountedRef  = useRef(true)
  const lastDataRef = useRef(null) // stores last synced data to compare

  useEffect(() => {
    mountedRef.current = true

    const apiUrl = import.meta.env.VITE_API_URL
    // No backend configured — skip entirely, never touch the store
    if (!apiUrl || apiUrl.trim() === '' || apiUrl === 'http://localhost:8000') {
      return
    }

    const syncDown = async () => {
      if (syncingRef.current || !mountedRef.current) return
      syncingRef.current = true

      // Update syncing indicator WITHOUT triggering page re-renders
      // We use getState() directly — no subscription, no re-render
      useAppStore.getState().setSyncing(true)

      try {
        const res = await api.getStudents()
        if (!mountedRef.current) return

        const newStudents = res?.data?.students
        if (newStudents?.length) {
          // Only update store if data actually changed
          if (!isEqual(lastDataRef.current, newStudents)) {
            lastDataRef.current = newStudents
            useAppStore.getState().setStudents(newStudents)
            // Write to IndexedDB silently in background
            db.students.clear()
              .then(() => db.students.bulkAdd(newStudents))
              .catch(() => {})
          }
          // If data is same — do nothing, no re-render
        }

        if (mountedRef.current) {
          useAppStore.getState().setLastSynced(new Date().toISOString())
        }
      } catch {
        // Backend down / offline — silent, use existing local data
      } finally {
        syncingRef.current = false
        if (mountedRef.current) {
          useAppStore.getState().setSyncing(false)
        }
      }
    }

    const syncUp = async () => {
      if (!mountedRef.current) return
      let queue = []
      try {
        queue = await getSyncQueue()
      } catch {
        return
      }
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
          } catch {
            // Skip individual failed items
          }
        }
        await clearSyncQueue()
      } catch {
        // Keep queue for next cycle
      }
    }

    // First sync: wait 8 seconds after app loads
    const firstTimer = setTimeout(syncDown, 8000)

    // Repeat every 60 seconds — frequent enough to stay fresh,
    // slow enough to never be noticeable
    const interval = setInterval(async () => {
      await syncUp()
      await syncDown()
    }, 60000)

    return () => {
      mountedRef.current = false
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  }, []) // Empty deps — runs once only on mount
}
