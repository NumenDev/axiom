import { useEffect, useRef, useState } from 'react'
import {
  defaults,
  preferences,
  type PreferenceStore,
  type Preferences,
} from '../application/preferences'

export function usePreferences(store: PreferenceStore = preferences) {
  const [layout, setLayout] = useState<Preferences>(defaults)
  const [status, setStatus] = useState<'loading' | 'ready' | 'session' | 'error'>('loading')
  const [writable, setWritable] = useState(false)
  const saved = useRef<Preferences>(defaults)
  const queue = useRef(Promise.resolve())
  useEffect(() => {
    let current = true
    store
      .load()
      .then((value) => {
        if (!current) return
        saved.current = value
        setLayout(value)
        setWritable(true)
        setStatus('ready')
      })
      .catch(() => {
        if (current) setStatus('session')
      })
    return () => {
      current = false
    }
  }, [store])
  useEffect(() => {
    if (!writable || layout === saved.current) return
    let current = true

    queue.current = queue.current
      .then(async () => {
        if (!current) return
        await store.save(layout)
        saved.current = layout
        if (current) setStatus('ready')
      })
      .catch(() => {
        if (current) setStatus('error')
      })

    return () => {
      current = false
    }
  }, [layout, writable, store])
  return { layout, setLayout, status }
}
