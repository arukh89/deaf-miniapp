"use client"

import { erc20Abi, parseEther, parseUnits, createPublicClient, custom } from "viem"
import { base } from "viem/chains"
import { getMiniAppProvider, getMiniAppWalletClient, ensureBaseChain, getPrimaryAccount } from "./miniappProvider"

type Hex = `0x${string}`

export async function getErc20Decimals(token: Hex): Promise<number> {
  const provider = await getMiniAppProvider()
  if (!provider) throw new Error('no_provider')
  const pc = createPublicClient({ chain: base, transport: custom(provider) })
  const dec = await pc.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' })
  return Number(dec)
}

export async function sendEthViaMiniApp(params: { to: Hex; amountEth: string }) {
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
    to: params.to,
    value: parseEther(params.amountEth),
  })
}

export async function sendErc20ViaMiniApp(params: { token: Hex; to: Hex; amount: string; decimals: number }) {
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
      pc.readContract({ address: params.token, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
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
    address: params.token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.to, parseUnits(params.amount, params.decimals)],
    account,
  })
}
