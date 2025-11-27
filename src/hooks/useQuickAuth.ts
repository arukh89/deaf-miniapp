'use client'

import { useEffect } from 'react'

export function useQuickAuth(isInFarcaster: boolean) {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Simple auth check - in a real app this would connect to Farcaster
        console.log('QuickAuth check - In Farcaster:', isInFarcaster)
      } catch (error) {
        console.error('QuickAuth initialization error:', error)
      }
    }

    if (isInFarcaster) {
      initializeAuth()
    }
  }, [isInFarcaster])
}