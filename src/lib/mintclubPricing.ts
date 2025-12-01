"use client"

import { mintclub } from 'mint.club-v2-sdk'

const SDEAFS = process.env.NEXT_PUBLIC_SDEAFS_ADDRESS as string | undefined

export async function getSdeafsUsdRate(): Promise<number> {
  if (!SDEAFS) throw new Error('sdeafs_address_missing')
  const token = mintclub.network('base').token(SDEAFS)
  const usd = await token.getUsdRate({ amount: 1 })
  return usd
}

export async function estimateSdeafsForUsd(usd: number): Promise<string> {
  const usdPerToken = await getSdeafsUsdRate()
  if (!usdPerToken || usdPerToken <= 0) throw new Error('rate_unavailable')
  const tokens = usd / usdPerToken
  return tokens.toFixed(6)
}
