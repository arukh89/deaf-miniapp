'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Check, ArrowRight } from 'lucide-react'

interface UpgradePromptProps {
  context?: 'camera' | 'translation' | 'general'
  onDonate?: () => void
}

const UPGRADE_FEATURES = {
  camera: {
    title: "Unlock AI-Powered Gesture Recognition",
    description: "Enjoying the app? Upgrade to unlock advanced features that make sign language translation even better!",
    features: [
      "Automatic gesture recognition with AI",
      "Real-time hand tracking and analysis",
      "Support for complex sign language sentences",
      "Higher accuracy with OpenAI Vision"
    ]
  },
  translation: {
    title: "Get Smart AI Translation",
    description: "Your support helps us bring cutting-edge translation technology to the deaf community!",
    features: [
      "Context-aware translations",
      "Natural language processing",
      "Support for idioms and expressions",
      "Premium voice synthesis with ElevenLabs"
    ]
  },
  general: {
    title: "Support Premium Features",
    description: "Help us build better tools for the deaf community and get access to amazing premium features!",
    features: [
      "AI-powered gesture recognition",
      "Advanced translation with GPT-4",
      "High-quality natural voices",
      "Priority support and updates"
    ]
  }
}

export function UpgradePrompt({ context = 'general', onDonate }: UpgradePromptProps) {
  const config = UPGRADE_FEATURES[context]

  const handleUpgrade = (): void => {
    if (onDonate) {
      onDonate()
    } else {
      // Scroll to donate section
      const donateTab = document.querySelector('[value="donate"]')
      if (donateTab) {
        ;(donateTab as HTMLElement).click()
      }
    }
  }

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-6 h-6 text-purple-600" />
              {config.title}
            </CardTitle>
            <CardDescription className="text-purple-700">
              {config.description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
            Premium
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-purple-900">What your support unlocks:</p>
          <ul className="space-y-2">
            {config.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-purple-800">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-white/80 rounded-lg border border-purple-200 space-y-2">
          <p className="text-sm font-medium text-purple-900">
            How your donation helps:
          </p>
          <ul className="space-y-1 text-sm text-purple-700">
            <li>✨ Maintains and improves the app</li>
            <li>💜 Supports the deaf community directly</li>
            <li>🚀 Enables new premium features</li>
            <li>🎯 Provides you with early access to updates</li>
          </ul>
        </div>

        <Button 
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          size="lg"
        >
          Support & Unlock Features
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-center text-purple-600 italic">
          Every donation makes a difference for the deaf community! 💜
        </p>
      </CardContent>
    </Card>
  )
}
