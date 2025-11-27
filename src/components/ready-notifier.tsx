'use client'

import { useEffect } from 'react'

export function ReadyNotifier() {
  useEffect(() => {
    const run = async () => {
      try {
        // Lazy-load SDK only in runtime to avoid desktop fetches
        const { sdk } = await import('@farcaster/miniapp-sdk')
        // Official way to reveal content in Mini Apps
        await sdk.actions.ready()
      } catch (e) {
        // Fallback: notify parent manually if SDK not available
        if (typeof window !== 'undefined' && window.parent) {
          window.parent.postMessage({ type: 'mini_app_ready', timestamp: Date.now() }, '*')
        }
      }
    }
    void run()
  }, [])

  return null
}