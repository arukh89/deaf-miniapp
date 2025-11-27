'use client'

import { useCallback } from 'react'

export function useAddMiniApp() {
  const addMiniApp = useCallback(async () => {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      // Add to mini app to user's Farcaster profile
      // Check if addMiniApp method exists
      if (sdk.actions && sdk.actions.addMiniApp) {
        await sdk.actions.addMiniApp()
      } else {
        console.warn('addMiniApp method not available in SDK')
      }
    } catch (error) {
      console.error('Error adding mini app:', error)
      // Don't throw error to prevent breaking the app
    }
  }, [])

  return { addMiniApp }
}