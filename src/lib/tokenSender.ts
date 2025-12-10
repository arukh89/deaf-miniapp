"use client"

import { erc20Abi, parseEther, parseUnits, createPublicClient, custom } from "viem"
import { base } from "viem/chains"
import { getMiniAppProvider, getMiniAppWalletClient, ensureBaseChain, getPrimaryAccount, getBaseAppProvider, getAnyInjectedProvider } from "./miniappProvider"

type Hex = `0x${string}`

export async function getErc20Decimals(token: string): Promise<number> {
  // Try any available injected provider (Base App, Warplet, etc.)
  const provider = await getAnyInjectedProvider()
  if (!provider) throw new Error('no_provider')
  const pc = createPublicClient({ chain: base, transport: custom(provider) })
  const dec = await pc.readContract({ address: token as Hex, abi: erc20Abi, functionName: 'decimals' })
  return Number(dec)
}

export async function sendEthViaMiniApp(params: { to: string; amountEth: string }) {
  const provider = await getMiniAppProvider()
  if (!provider) throw new Error("no_provider")
  const client = await getMiniAppWalletClient()
  if (!client) throw new Error("no_client")

  await ensureBaseChain(provider)
  const account = await getPrimaryAccount(provider, client)

  // Pre-flight balance check (insufficient funds)
  try {
    const pc = createPublicClient({ chain: base, transport: custom(provider) })
    const [bal, gasPrice] = await Promise.all([
      pc.getBalance({ address: account }),
      pc.getGasPrice(),
    ])
    const value = parseEther(params.amountEth)
    const gasLimit = BigInt(21000) // ETH transfer baseline
    const needed = value + gasPrice * gasLimit
    if (bal < needed) throw new Error("insufficient_balance")
  } catch (e) {
    const err = e as Error
    if (err.message === "insufficient_balance") throw err
    // ignore estimation failures; let wallet handle
  }

  return client.sendTransaction({
    account,
    to: params.to as Hex,
    value: parseEther(params.amountEth),
  })
}

export async function sendErc20ViaMiniApp(params: { contract: string; to: string; amount: string; decimals: number }) {
  const provider = await getMiniAppProvider()
  if (!provider) throw new Error("no_provider")
  const client = await getMiniAppWalletClient()
  if (!client) throw new Error("no_client")

  await ensureBaseChain(provider)
  const account = await getPrimaryAccount(provider, client)

  // Pre-flight checks: token balance and ETH for gas
  try {
    const pc = createPublicClient({ chain: base, transport: custom(provider) })
    const [tokenBal, gasPrice] = await Promise.all([
      pc.readContract({ address: params.contract as Hex, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
      pc.getGasPrice(),
    ])
    const amount = parseUnits(params.amount, params.decimals)
    if ((tokenBal as bigint) < amount) throw new Error("insufficient_balance")

    // Rough gas check for ERC20 transfer
    const ethBal = await pc.getBalance({ address: account })
    const gasLimit = BigInt(60000)
    const neededForGas = gasPrice * gasLimit
    if (ethBal < neededForGas) throw new Error("insufficient_balance")
  } catch (e) {
    const err = e as Error
    if (err.message === "insufficient_balance") throw err
    // ignore estimation failures; let wallet handle
  }

  return client.writeContract({
    address: params.contract as Hex,
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.to as Hex, parseUnits(params.amount, params.decimals)],
    account,
  })
}

// Base App path using Base Account SDK provider
export async function sendEthViaBaseApp(params: { to: string; amountEth: string }) {
  const provider = await getBaseAppProvider()
  if (!provider) throw new Error("no_provider")

  await ensureBaseChain(provider)

  // Pre-flight balance check similar to Mini App path
  try {
    const pc = createPublicClient({ chain: base, transport: custom(provider) })
    const from = await getPrimaryAccount(provider, pc as any)
    const [bal, gasPrice] = await Promise.all([
      pc.getBalance({ address: from }),
      pc.getGasPrice(),
    ])
    const value = parseEther(params.amountEth)
    const gasLimit = BigInt(21000)
    const needed = value + gasPrice * gasLimit
    if (bal < needed) throw new Error("insufficient_balance")
  } catch (e) {
    const err = e as Error
    if (err.message === "insufficient_balance") throw err
    // ignore estimation failures; let wallet handle
  }

  // Use low-level request to avoid relying on viem WalletClient when unavailable
  // but we still try to get account via helper
  const client = createPublicClient({ chain: base, transport: custom(provider) }) as any
  const from = await getPrimaryAccount(provider, client)
  return (provider as any).request?.({
    method: "eth_sendTransaction",
    params: [{ from, to: params.to, value: parseEther(params.amountEth).toString() }] as any,
  })
}

export async function sendErc20ViaBaseApp(params: { contract: string; to: string; amount: string; decimals: number }) {
  const provider = await getBaseAppProvider()
  if (!provider) throw new Error("no_provider")

  await ensureBaseChain(provider)

  // Pre-flight: token balance + ETH for gas
  try {
    const pc = createPublicClient({ chain: base, transport: custom(provider) })
    const from = await getPrimaryAccount(provider, pc as any)
    const [tokenBal, gasPrice] = await Promise.all([
      pc.readContract({ address: params.contract as Hex, abi: erc20Abi, functionName: 'balanceOf', args: [from] }),
      pc.getGasPrice(),
    ])
    const amount = parseUnits(params.amount, params.decimals)
    if ((tokenBal as bigint) < amount) throw new Error('insufficient_balance')

    const ethBal = await pc.getBalance({ address: from })
    const gasLimit = BigInt(60000)
    const neededForGas = gasPrice * gasLimit
    if (ethBal < neededForGas) throw new Error('insufficient_balance')
  } catch (e) {
    const err = e as Error
    if (err.message === 'insufficient_balance') throw err
    // ignore estimation failures
  }

  const client = createPublicClient({ chain: base, transport: custom(provider) })
  const from = await getPrimaryAccount(provider, client as any)

  // Encode ERC20 transfer data manually via viem
  const amount = parseUnits(params.amount, params.decimals)
  const data = (await import("viem")).encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.to as Hex, amount],
  })

  return (provider as any).request?.({
    method: "eth_sendTransaction",
    params: [{ from, to: params.contract, data }] as any,
  })
}
