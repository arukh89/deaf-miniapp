'use client'
import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Language } from '@/types'
import type { FarcasterUser } from '@/types'
import { GestureCamera } from '@/components/GestureCamera'
import { GestureCameraLive } from '@/components/GestureCameraLive'
import { LanguageSelector } from '@/components/LanguageSelector'
import { TranslationOutput } from '@/components/TranslationOutput'
import { GesturePhrases } from '@/components/GesturePhrases'
import { DonationSection } from '@/components/DonationSection'
import { ManualInput } from '@/components/ManualInput'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hand, MessageSquare, Heart, User, Video } from 'lucide-react'
import { GESTURE_PHRASES } from '@/lib/constants'
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";

export default function Page(): JSX.Element {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')
  const [translatedText, setTranslatedText] = useState<string>('')
  const [capturedImage, setCapturedImage] = useState<string>('')
    const { addMiniApp } = useAddMiniApp();
    const isInFarcaster = useIsInFarcaster()
    useQuickAuth(isInFarcaster)
    useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const res = await sdk.quickAuth.fetch('/api/me')
        if (res.ok) {
          const userData = await res.json() as FarcasterUser
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        sdk.actions.ready()
      }
    }

    initAuth()
  }, [])

  const handlePhraseSelect = (phraseKey: string): void => {
    const translations = GESTURE_PHRASES[phraseKey as keyof typeof GESTURE_PHRASES]
    if (translations) {
      const translated = translations[selectedLanguage]
      setTranslatedText(translated)
    }
  }

  const handleManualInput = (text: string): void => {
    // For manual input, we'll use a simple translation map
    // In a Pro version, this would use OpenAI for proper translation
    const lowerText = text.toLowerCase()
    
    // Try to find matching phrase
    for (const key of Object.keys(GESTURE_PHRASES)) {
      const englishPhrase = GESTURE_PHRASES[key as keyof typeof GESTURE_PHRASES].en.toLowerCase()
      if (lowerText.includes(englishPhrase)) {
        const translated = GESTURE_PHRASES[key as keyof typeof GESTURE_PHRASES][selectedLanguage]
        setTranslatedText(translated)
        return
      }
    }
    
    // If no match, show the input text (would be translated in Pro version)
    setTranslatedText(text)
  }

  const handleImageCapture = (imageUrl: string, gesture?: string, confidence?: number): void => {
    setCapturedImage(imageUrl)
    
    console.log('📷 Image Captured:', { gesture, confidence })
    
    if (gesture && confidence && confidence >= 0.75) {
      // Gesture was detected automatically!
      console.log('🎯 Looking up translation for:', gesture)
      const translations = GESTURE_PHRASES[gesture as keyof typeof GESTURE_PHRASES]
      if (translations) {
        const translated = translations[selectedLanguage]
        console.log('✅ Translation found:', translated)
        setTranslatedText(translated)
      } else {
        console.log('❌ No translation found for:', gesture)
        setTranslatedText('Gesture not in translation database. Please select manually.')
      }
    } else {
      // No gesture detected, prompt user to select manually
      console.log('❌ No clear gesture detected')
      setTranslatedText('Gesture not detected clearly. Please select from the phrases below or retake photo.')
    }
  }

  const handleGestureDetected = (phraseKey: string, confidence: number): void => {
    console.log('🎯 Live Gesture Detected:', phraseKey, confidence)
    const translations = GESTURE_PHRASES[phraseKey as keyof typeof GESTURE_PHRASES]
    if (translations) {
      const translated = translations[selectedLanguage]
      console.log('✅ Translation:', translated, 'Language:', selectedLanguage)
      setTranslatedText(translated)
    } else {
      console.log('❌ No translation for:', phraseKey)
      setTranslatedText('Translation not available for this gesture.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Hand className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-bounce" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-500/50 animate-pulse">
              <Hand className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
              Sign Language Translator
            </h1>
          </div>
          <p className="text-gray-300 text-lg backdrop-blur-sm bg-white/5 rounded-full px-6 py-2 inline-block border border-white/10">
            Translate gestures to text and voice for the deaf community
          </p>
          
          {user && (
            <Card className="mt-4 max-w-md mx-auto bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {user.pfpUrl ? (
                    <img
                      src={user.pfpUrl}
                      alt={user.displayName || user.username || 'User'}
                      className="w-10 h-10 rounded-full ring-2 ring-purple-400/50 shadow-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-white">{user.displayName || user.username}</p>
                    <p className="text-sm text-purple-300">FID: {user.fid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Language Selector */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-slate-900/60 to-purple-900/60 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20">
            <CardContent className="p-6">
              <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto bg-gradient-to-r from-slate-900/80 to-purple-900/80 backdrop-blur-xl border border-purple-500/30 shadow-2xl">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Live AI</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">Capture</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="donate" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Donate</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border border-emerald-500/30 rounded-lg p-4 backdrop-blur-xl shadow-xl shadow-emerald-500/20">
                <h3 className="font-semibold text-emerald-200 mb-2 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  Live AI Gesture Recognition (FREE!)
                </h3>
                <p className="text-sm text-emerald-300">
                  Real-time continuous gesture detection using MediaPipe AI. Hold gestures for 0.5s to translate automatically!
                </p>
              </div>
              <GestureCameraLive onGestureDetected={handleGestureDetected} />
              <TranslationOutput text={translatedText} language={selectedLanguage} />
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-4 backdrop-blur-xl shadow-xl shadow-purple-500/20">
                <h3 className="font-semibold text-purple-200 mb-2 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <Hand className="w-5 h-5 text-white" />
                  </div>
                  AI Gesture Analysis from Photo
                </h3>
                <p className="text-sm text-purple-300">
                  Capture a photo and AI will automatically analyze and detect your hand gesture!
                </p>
              </div>
              <GestureCamera onCapture={handleImageCapture} />
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <p className="text-xs text-purple-300 text-center">
                  💡 Tip: If gesture isn't detected, you can manually select from phrases below
                </p>
              </div>
              <GesturePhrases onSelectPhrase={handlePhraseSelect} />
              <TranslationOutput text={translatedText} language={selectedLanguage} />
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <ManualInput onSubmit={handleManualInput} />
            <GesturePhrases onSelectPhrase={handlePhraseSelect} />
            <TranslationOutput text={translatedText} language={selectedLanguage} />
          </TabsContent>

          <TabsContent value="donate">
            <DonationSection userFid={user?.fid} />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 border-cyan-500/30 bg-gradient-to-br from-slate-900/60 to-cyan-900/60 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-cyan-200 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                <Hand className="w-5 h-5 text-white" />
              </div>
              About This App
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-cyan-300 space-y-3">
            <p className="font-medium">
              This mini app helps translate sign language gestures into text and voice across multiple languages, making communication more accessible for the deaf community.
            </p>
            <div>
              <p className="font-semibold mb-1">✨ Current features (100% FREE!):</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>🎥 Live AI gesture recognition with MediaPipe</li>
                <li>📸 AI gesture analysis from captured photos</li>
                <li>👋 42+ comprehensive gesture phrases</li>
                <li>🗣️ Text-to-speech in 7 languages</li>
                <li>💰 Direct donation support on Base</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">🚀 Your donations help us add:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>🤖 Advanced AI gesture analysis (OpenAI Vision)</li>
                <li>🌍 Smart multi-language translation</li>
                <li>🎙️ Premium natural voice synthesis (ElevenLabs)</li>
                <li>📚 Extended gesture library with custom gestures</li>
                <li>👥 Community gesture sharing</li>
                <li>📱 Mobile app development</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-purple-500/30 shadow-xl">
            <p className="text-purple-300">Built with ❤️ for the deaf community on Base</p>
            <p className="mt-1 text-purple-400">Developer: @{user?.username || 'ukhy89'} • FID: 250704</p>
          </div>
        </div>
      </div>
    </div>
  )
}
