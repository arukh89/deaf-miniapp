'use client'

import { useState, useEffect } from 'react'

export function useIsInFarcaster(): boolean {
  const [isInFarcaster, setIsInFarcaster] = useState(false)

  useEffect(() => {
    // Check if we're running in a Farcaster environment
    const checkFarcasterEnvironment = () => {
      // Check for Farcaster-specific window objects or URL patterns
      const isFarcaster = window.location.href.includes('farcaster') ||
                        !!(window as any).farcaster
      
      setIsInFarcaster(isFarcaster)
    }

    checkFarcasterEnvironment()
  }, [])

  return isInFarcaster
}