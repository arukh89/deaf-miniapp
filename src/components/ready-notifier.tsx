'use client'

import { useEffect } from 'react'

export function ReadyNotifier() {
  useEffect(() => {
    // Notify parent that the mini-app is ready
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'mini_app_ready',
        timestamp: Date.now()
      }, '*')
    }
  }, [])

  return null
}