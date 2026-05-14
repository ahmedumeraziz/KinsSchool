import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const add = useCallback((msg, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, msg, type }])
    timers.current[id] = setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id))
      delete timers.current[id]
    }, duration)
  }, [])

  return { toasts, add, remove }
}
