'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function ReadyNotifier() {
  useEffect(() => {
    const run = async () => {
      try {
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