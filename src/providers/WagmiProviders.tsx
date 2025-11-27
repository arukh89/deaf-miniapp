"use client"

import React, { useEffect, useMemo } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { injected } from "wagmi/connectors"
import { base } from "viem/chains"
import { http } from "viem"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAccount, useConnect } from "wagmi"

const queryClient = new QueryClient()

const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [injected()],
  ssr: true,
  multiInjectedProviderDiscovery: true,
})

function AutoConnect() {
  const { isConnected } = useAccount()
  const { connectors, connectAsync } = useConnect()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (isConnected) return
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const inMiniApp = await sdk.isInMiniApp().catch(() => false)
        if (!inMiniApp) return
        const injectedConn =
          connectors.find((c) => c.id === "injected" || c.name.toLowerCase().includes("injected")) ||
          connectors[0]
        if (!injectedConn) return
        if (cancelled) return
        await connectAsync({ connector: injectedConn })
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isConnected, connectors, connectAsync])
  return null
}

export function WagmiProviders({ children }: { children: React.ReactNode }) {
  // stable memo in case Next fast refresh re-mounts
  const qc = useMemo(() => queryClient, [])
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
