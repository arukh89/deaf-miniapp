'use client'

import { useEffect } from 'react'

export function ResponseLogger() {
  useEffect(() => {
    // Log responses for debugging
    const logResponse = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        console.log('📡 Response Logger:', event.data)
      }
    }

    window.addEventListener('message', logResponse)
    
    return () => {
      window.removeEventListener('message', logResponse)
    }
  }, [])

  return null
}