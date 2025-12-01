'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink, Loader2, Sparkles, Users, Rocket, Shield, FileText, TrendingUp, CheckCircle2, Wallet } from 'lucide-react'
import { CREATOR_WALLET, CREATOR_USERNAME, CREATOR_FID, DONATION_TOKENS, BASE_CHAIN_ID } from '@/lib/constants'
import { useIsInFarcaster } from '@/hooks/useIsInFarcaster'
import { SuccessMessage } from './SuccessMessage'
import { ErrorMessage } from './ErrorMessage'
import { sendEthViaMiniApp, sendErc20ViaMiniApp, getErc20Decimals } from '@/lib/tokenSender'
import { parseUnits } from 'viem'
import { estimateSdeafsForUsd } from '@/lib/mintclubPricing'

interface DonationSectionProps {
  userFid?: number
}

export function DonationSection({ userFid }: DonationSectionProps) {
  const isInFarcaster = useIsInFarcaster()
  // direct viem path via Mini App provider
  const [amount, setAmount] = useState<string>('')
  const [token, setToken] = useState<'ETH' | 'USDC' | 'sDEAFs'>('ETH')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [sdeafsEstimate, setSdeafsEstimate] = useState<string | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)

  const quickAmounts = [5, 10, 20, 50]

  const handleQuickAmount = (quickAmount: number): void => {
    setAmount(quickAmount.toString())
    setSelectedAmount(quickAmount)
  }

  // Live estimate for sDEAFs when amount is treated as USD
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (token !== 'sDEAFs') {
        setSdeafsEstimate(null)
        setPricingError(null)
        return
      }
      const v = parseFloat(amount)
      if (!amount || isNaN(v) || v <= 0) {
        setSdeafsEstimate(null)
        setPricingError(null)
        return
      }
      setPricingError(null)
      try {
        const est = await estimateSdeafsForUsd(v)
        if (!cancelled) setSdeafsEstimate(est)
      } catch (e) {
        if (!cancelled) {
          setSdeafsEstimate(null)
          setPricingError('rate_unavailable')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token, amount])

  const handleDonate = async (): Promise<void> => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    setIsProcessing(true)
    setError('')

    // Resolve token data
    const usdcToken = DONATION_TOKENS.find((t) => t.symbol === 'USDC' && t.address)
    const sdeafsToken = DONATION_TOKENS.find((t) => t.symbol === 'sDEAFs' && t.address)
    const isErc20 = token !== 'ETH'
    const selectedErc20 = token === 'USDC' ? usdcToken : token === 'sDEAFs' ? sdeafsToken : null
    // decimals: ETH=18, USDC=6, sDEAFs=read on-chain (fallback ke constants)
    const decimals =
      token === 'ETH'
        ? 18
        : token === 'USDC'
        ? 6
        : sdeafsToken?.address
        ? await getErc20Decimals(sdeafsToken.address as `0x${string}`).catch(() => sdeafsToken?.decimals ?? 18)
        : 18

    // deeplink token param
    const tokenAddress = isErc20 && selectedErc20?.address
      ? `eip155:${BASE_CHAIN_ID}/erc20:${selectedErc20.address}`
      : `eip155:${BASE_CHAIN_ID}/native`

    // Interpret amount: when sDEAFs is selected, amount field represents USD and we convert to token units
    let amountToken = amount
    if (token === 'sDEAFs') {
      try {
        const est = await estimateSdeafsForUsd(parseFloat(amount))
        amountToken = est
      } catch (e) {
        console.warn('USD→sDEAFs rate unavailable, falling back to manual token input')
      }
    }

    // amount smallest unit (pakai viem agar akurat)
    const amountInSmallestUnit = parseUnits(amountToken, decimals).toString()

    // Build Warpcast deep link (redundant recipient keys for safety)
    const params = new URLSearchParams({
      token: tokenAddress,
      amount: amountInSmallestUnit,
      recipient: CREATOR_WALLET,
      recipientAddress: CREATOR_WALLET,
    })
    const warpcastUrl = `https://warpcast.com/~/send?${params.toString()}`

    try {
      // Use viem + Mini App injected provider (Warplet) → native overlay sheet
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const inMiniApp = await sdk.isInMiniApp().catch(() => false)
        if (inMiniApp) {
          if (token === 'ETH') {
            await sendEthViaMiniApp({ to: CREATOR_WALLET as `0x${string}`, amountEth: amount })
          } else {
            if (!selectedErc20?.address) throw new Error('Token address unavailable')
            await sendErc20ViaMiniApp({
              token: selectedErc20.address as `0x${string}`,
              to: CREATOR_WALLET as `0x${string}`,
              amount: amountToken,
              decimals,
            })
          }
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 10000)
          return
        }
      } catch (e) {
        console.error('miniapp viem send failed, falling back to openUrl', e)
      }

      // Fallbacks: open Warpcast deeplink to Warplet (web/desktop)
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.openUrl(warpcastUrl)
      } catch {
        window.open(warpcastUrl, isInFarcaster ? '_top' : '_blank')
      }

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 10000)
      
    } catch (error) {
      console.error('Donation error:', error)
      // Fallback: copy link to clipboard for manual open
      try {
        await navigator.clipboard.writeText(warpcastUrl)
        setError('Popup blocked. Link copied — paste into your browser to complete the donation.')
      } catch {
        setError('Unable to open donation page. Please check your connection and try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Donation Card - Premium Design */}
      <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-2xl overflow-hidden relative">
        {/* Premium Badge */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-bl-full opacity-10"></div>
        
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-amber-700 via-orange-600 to-red-600 bg-clip-text text-transparent font-bold">
                <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />
                Support the Deaf Community
              </CardTitle>
              <CardDescription className="text-base text-amber-900 font-medium">
                Join us in building a more accessible world for everyone
              </CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-lg px-3 py-1 text-sm font-bold">
              🏆 Premium Support
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative">
          {/* Impact Cards - Luxurious Design */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Users className="w-7 h-7 mx-auto mb-2 text-amber-600" />
              <p className="text-xs text-amber-900 font-bold">Empower Community</p>
            </div>
            <div className="text-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Sparkles className="w-7 h-7 mx-auto mb-2 text-orange-600" />
              <p className="text-xs text-orange-900 font-bold">Unlock AI Features</p>
            </div>
            <div className="text-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Rocket className="w-7 h-7 mx-auto mb-2 text-red-600" />
              <p className="text-xs text-red-900 font-bold">Future Innovation</p>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <SuccessMessage
              title="🎉 Thank You for Your Generosity!"
              message="Your contribution is making a real difference! You'll see regular updates on how your donation is being used to support the deaf community."
            />
          )}

          {/* Error Message */}
          {error && (
            <ErrorMessage
              type="general"
              message={error}
              onRetry={() => {
                setError('')
                handleDonate()
              }}
            />
          )}

          {/* Token Selection - Premium Style */}
          <div className="space-y-3">
            <Label className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              1. Select Token
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={token === 'ETH' ? 'default' : 'outline'}
                onClick={() => setToken('ETH')}
                className={`w-full h-14 text-base font-bold transition-all ${
                  token === 'ETH' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg' 
                    : 'hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <span className="mr-2">⟠</span> ETH
              </Button>
              <Button
                variant={token === 'USDC' ? 'default' : 'outline'}
                onClick={() => setToken('USDC')}
                className={`w-full h-14 text-base font-bold transition-all ${
                  token === 'USDC' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg' 
                    : 'hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <span className="mr-2">💵</span> USDC
              </Button>
              <Button
                variant={token === 'sDEAFs' ? 'default' : 'outline'}
                onClick={() => setToken('sDEAFs')}
                className={`w-full h-14 text-base font-bold transition-all ${
                  token === 'sDEAFs'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                    : 'hover:border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                <span className="mr-2">💠</span> sDEAFs
              </Button>
            </div>
          </div>

          {/* Amount Selection - Premium Style */}
          <div className="space-y-3">
            <Label className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              2. Choose Amount{token === 'sDEAFs' ? ' (USD)' : ''}
            </Label>
            
            {/* Quick Amount Buttons - Luxurious */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount: number) => (
                <Button
                  key={quickAmount}
                  variant={selectedAmount === quickAmount ? 'default' : 'outline'}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`w-full h-12 font-bold transition-all ${
                    selectedAmount === quickAmount 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg scale-105' 
                      : 'hover:border-amber-400 hover:bg-amber-50 hover:scale-105'
                  }`}
                  size="sm"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>

            {/* Custom Amount Input - Premium */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm text-amber-700 font-medium">Or enter custom amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setAmount(e.target.value)
                  setSelectedAmount(null)
                }}
                step="0.01"
                min="0"
                className="h-12 text-lg border-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
              />
              {token === 'sDEAFs' && amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-amber-700">
                  ≈ {sdeafsEstimate ? `${sdeafsEstimate} sDEAFs` : pricingError ? 'rate unavailable — enter tokens manually' : 'fetching rate…'}
                </p>
              )}
            </div>
          </div>

          {/* Benefits Section - Premium Design */}
          <div className="p-5 bg-gradient-to-br from-white to-amber-50 rounded-xl border-2 border-amber-300 shadow-lg space-y-3">
            <p className="text-base font-bold text-amber-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Your Donation Impact:
            </p>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">✨</span>
                <span><strong>Maintain & Improve</strong> this free app for everyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">💜</span>
                <span><strong>Support deaf community</strong> members and survivors directly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">🤖</span>
                <span><strong>Enable AI features</strong> like OpenAI Vision & ElevenLabs voice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">🎯</span>
                <span><strong>Early access</strong> to new features and updates</span>
              </li>
            </ul>
          </div>

          {/* Transparency Section - Key Addition */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 shadow-lg space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <p className="text-base font-bold text-blue-900">
                🌟 100% Transparency Commitment
              </p>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <p className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>
                  <strong>Regular Reports in English:</strong> I commit to providing regular, detailed reports on how donations are being used.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Full Accountability:</strong> Every dollar will be tracked and reported transparently to the community.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                <span>
                  <strong>Community First:</strong> Your support goes directly to development and supporting deaf community members.
                </span>
              </p>
            </div>
            <div className="mt-3 p-3 bg-white/80 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium text-center">
                💎 I pledge to maintain the highest standards of transparency and accountability with your generous contributions
              </p>
            </div>
          </div>

          {/* Warplet Integration Info */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-bold text-purple-900">Secure Donation via Warplet</p>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              Donations are processed securely through <strong>Warplet Wallet</strong> on Farcaster. 
              Click the button below to open a pre-filled transaction in Warpcast where you can review and confirm your donation.
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <Shield className="w-4 h-4" />
              <span className="font-medium">100% secure • Base mainnet • Direct to developer</span>
            </div>
          </div>

          {/* Recipient Info - Premium Style */}
          <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-gray-200 shadow-lg">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <span className="font-bold text-amber-900">Developer:</span> 
              <Badge variant="outline" className="border-amber-400 text-amber-700">
                @{CREATOR_USERNAME}
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-700">
                FID: {CREATOR_FID}
              </Badge>
            </p>
            <div>
              <p className="text-xs text-gray-600 mb-1 font-medium">Recipient Wallet (Base Mainnet):</p>
              <code className="text-xs break-all block bg-gradient-to-r from-gray-100 to-gray-50 p-3 rounded-lg font-mono border border-gray-300 shadow-inner">
                {CREATOR_WALLET}
              </code>
            </div>
          </div>

          {/* Main Donate Button - Ultra Premium */}
          <Button
            onClick={handleDonate}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 border-2 border-amber-400"
            size="lg"
            disabled={isProcessing || !amount}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Opening Warplet...
              </>
            ) : (
              <>
                <Heart className="w-6 h-6 mr-2 fill-white animate-pulse" />
                {token === 'sDEAFs'
                  ? (amount ? `Donate $${amount} → ≈ ${sdeafsEstimate ?? '…'} sDEAFs` : 'Donate')
                  : (amount ? `Donate ${amount} ${token}` : 'Donate')}
                 via Warplet
                <ExternalLink className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-amber-700 italic font-medium">
            🌟 All donations processed on Base mainnet via Warplet. 100% transparency guaranteed.
          </p>
        </CardContent>
      </Card>

      {/* Gratitude Card - Luxurious */}
      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 shadow-xl">
        <CardContent className="p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
          <p className="text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
            🙏 Thank You for Your Kindness!
          </p>
          <p className="text-sm text-purple-700 leading-relaxed max-w-2xl mx-auto">
            Every contribution, no matter the size, creates a ripple effect of positive change. 
            Your support helps us build better accessibility tools and directly empowers the deaf community. 
            Together, we're making the world more inclusive for everyone. 💜
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              ✨ Community Builder
            </Badge>
            <Badge className="bg-pink-100 text-pink-800 border-pink-300">
              💎 Premium Supporter
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
