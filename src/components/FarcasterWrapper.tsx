'use client'

import { ReactNode } from 'react'

interface FarcasterWrapperProps {
  children: ReactNode
}

export default function FarcasterWrapper({ children }: FarcasterWrapperProps) {
  return (
    <div className="farcaster-wrapper">
      {children}
    </div>
  )
}