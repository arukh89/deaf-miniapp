"use client"

import { erc20Abi, parseEther, parseUnits } from "viem"
import { getMiniAppProvider, getMiniAppWalletClient, ensureBaseChain, getPrimaryAccount } from "./miniappProvider"

type Hex = `0x${string}`

export async function sendEthViaMiniApp(params: { to: Hex; amountEth: string }) {
  const provider = await getMiniAppProvider()
  if (!provider) throw new Error("no_provider")
  const client = await getMiniAppWalletClient()
  if (!client) throw new Error("no_client")

  await ensureBaseChain(provider)
  const account = await getPrimaryAccount(provider, client)

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

  return client.writeContract({
    address: params.token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.to, parseUnits(params.amount, params.decimals)],
    account,
  })
}
