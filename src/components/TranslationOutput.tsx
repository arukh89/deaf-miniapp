'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Copy, Check } from 'lucide-react'
import type { Language } from '@/types'
import { speechService } from '@/lib/speech'
import { ErrorMessage } from './ErrorMessage'
import { feedbackService } from '@/lib/feedbackService'

interface TranslationOutputProps {
  text: string
  language: Language
}

export function TranslationOutput({ text, language }: TranslationOutputProps): JSX.Element {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [speechError, setSpeechError] = useState<string>('')

  const handleSpeak = async (): Promise<void> => {
    if (!text) return

    try {
      setSpeechError('')
      setIsSpeaking(true)
      
      // Haptic feedback when starting speech
      feedbackService.vibrateSuccess()
      
      await speechService.speak(text, language)
      setIsSpeaking(false)
    } catch (error) {
      console.error('Speech error:', error)
      const err = error as Error
      setSpeechError(err.message || 'speech_failed')
      setIsSpeaking(false)
    }
  }

  const handleCopy = async (): Promise<void> => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  const handleStopSpeech = (): void => {
    speechService.stop()
    setIsSpeaking(false)
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-blue-900/60 backdrop-blur-xl border-blue-500/30 shadow-2xl shadow-blue-500/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between text-blue-200">
          <span className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            Translation Output
          </span>
          <div className="flex gap-2">
            {text && (
              <>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={isSpeaking ? handleStopSpeech : handleSpeak}
                  variant={isSpeaking ? 'destructive' : 'default'}
                  size="sm"
                  className={isSpeaking ? 'gap-2' : 'gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/50 border-0'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Speak
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speechError && (
          <ErrorMessage
            type="speech"
            message={
              speechError === 'speech_not_supported'
                ? "Your browser doesn't support text-to-speech. Please try Chrome or Safari."
                : "Unable to play voice output. Please check your device volume and try again."
            }
            onRetry={() => {
              setSpeechError('')
              handleSpeak()
            }}
          />
        )}

        {text ? (
          <div className="p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg border-2 border-blue-400/30 backdrop-blur-xl shadow-2xl shadow-blue-500/20">
            <p className="text-2xl text-center font-medium text-white leading-relaxed drop-shadow-lg">
              {text}
            </p>
          </div>
        ) : (
          <div className="p-8 bg-slate-950/50 rounded-lg border-2 border-dashed border-gray-600">
            <p className="text-center text-gray-500 text-sm">
              Translation will appear here...
            </p>
          </div>
        )}

        {text && (
          <p className="text-xs text-center text-blue-300">
            Click "Speak" to hear the translation in the selected language
          </p>
        )}
      </CardContent>
    </Card>
  )
}
