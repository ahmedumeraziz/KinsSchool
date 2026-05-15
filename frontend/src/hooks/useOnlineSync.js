/**
 * useOnlineSync.js
 * Listens for online event and auto-flushes queued data to Google Sheets.
 */
import { useEffect, useRef } from 'react'
import { flushQueue, getQueueCount } from '../utils/syncService'

export function useOnlineSync(toast) {
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])

  useEffect(() => {
    const handleOnline = async () => {
      const count = getQueueCount()
      if (count === 0) return

      toastRef.current?.(`📶 Back online — syncing ${count} queued item(s)…`, 'info')

      const result = await flushQueue()

      if (result.flushed > 0) {
        toastRef.current?.(`✅ Synced ${result.flushed} item(s) to Google Sheets!`, 'success')
      }
      if (result.remaining > 0) {
        toastRef.current?.(`⚠️ ${result.remaining} item(s) still pending.`, 'warn')
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])
}
