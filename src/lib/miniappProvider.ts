"use client"

import { custom, type EIP1193Provider, createWalletClient } from "viem"
import { base } from "viem/chains"

// Discover an injected EIP-1193 provider inside Warpcast Mini App (Warplet)
export async function getMiniAppProvider(): Promise<EIP1193Provider | null> {
  if (typeof window === "undefined") return null

  // 0) Prefer Farcaster Mini App SDK provider (Warplet)
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk")
    const p = await sdk.wallet.getEthereumProvider().catch(() => null)
    if (p && (p as any)?.request) return p as EIP1193Provider
  } catch {
    // ignore and continue to fallbacks
  }

  // 1) Standard injection
  const eth: any = (window as any).ethereum
  if (eth?.providers?.length) {
    // pick the first provider – Warpcast injects a single provider
    const p = eth.providers.find((p: any) => !!p?.request) || eth.providers[0]
    if (p) return p as EIP1193Provider
  }
  if (eth?.request) return eth as EIP1193Provider

  // 2) EIP-6963 provider discovery (announceProvider)
  const providers: EIP1193Provider[] = []
  try {
    await new Promise<void>((resolve) => {
      const handler = (event: any) => {
        const provider = event?.detail?.provider as EIP1193Provider | undefined
        if (provider) providers.push(provider)
      }
      window.addEventListener("eip6963:announceProvider", handler as any)
      window.dispatchEvent(new Event("eip6963:requestProvider"))
      // give it a short time
      setTimeout(() => {
        window.removeEventListener("eip6963:announceProvider", handler as any)
        resolve()
      }, 250)
    })
  } catch {}
  if (providers.length) return providers[0]!

  return null
}

export async function getMiniAppWalletClient() {
  const provider = await getMiniAppProvider()
  if (!provider) return null
  return createWalletClient({ chain: base, transport: custom(provider) })
}

// Discover Base App in-app wallet provider via Base Account SDK (when hosted inside Base App)
export async function getBaseAppProvider(): Promise<EIP1193Provider | null> {
  if (typeof window === "undefined") return null
  try {
    // Lazy import to avoid SSR issues and reduce bundle impact
    const mod: any = await import("@base-org/account")
    const createBaseAccountSDK = mod?.createBaseAccountSDK
    const baseConst = mod?.base
    if (!createBaseAccountSDK) return null
    const sdk = createBaseAccountSDK({
      appName: "Gesture Translator",
      appLogoUrl: "https://deaf-miniapp.vercel.app/icon.png",
      appChainIds: baseConst?.constants?.CHAIN_IDS?.base
        ? [baseConst.constants.CHAIN_IDS.base]
        : [8453],
    })
    const provider = sdk?.getProvider?.()
    if (provider && (provider as any).request) return provider as EIP1193Provider
  } catch {
    // ignore
  }
  return null
}

// Prefer Farcaster Warplet first, then Base App
export async function getAnyInjectedProvider(): Promise<EIP1193Provider | null> {
  const mini = await getMiniAppProvider()
  if (mini) return mini
  return getBaseAppProvider()
}

export async function ensureBaseChain(provider: EIP1193Provider): Promise<void> {
  // Base mainnet = 8453 = 0x2105
  try {
    await provider.request?.({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    })
  } catch {
    // ignore if already on Base or method unsupported
  }
}

export async function getPrimaryAccount(
  provider: EIP1193Provider,
  client: any
): Promise<`0x${string}`> {
  try {
    const addrs = await client?.getAddresses?.()
    if (addrs && addrs[0]) return addrs[0] as `0x${string}`
  } catch {}
  try {
    const addrs = (await provider.request?.({ method: "eth_requestAccounts" })) as string[]
    if (addrs && addrs[0]) return addrs[0] as `0x${string}`
  } catch {}
  // fallback to eth_accounts (no prompt)
  const addrs = (await provider.request?.({ method: "eth_accounts" })) as string[]
  if (addrs && addrs[0]) return addrs[0] as `0x${string}`
  throw new Error("no_account")
}
