import type { Language } from '@/types'

// Map our language codes to Web Speech API language codes
const SPEECH_LANG_MAP: Record<Language, string> = {
  en: 'en-US',
  id: 'id-ID',
  zh: 'zh-CN',
  ru: 'ru-RU',
  ar: 'ar-SA',
  th: 'th-TH',
  vi: 'vi-VN',
}

export class SpeechService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices(): void {
    if (!this.synth) return

    const loadVoicesHandler = (): void => {
      this.voices = this.synth!.getVoices()
    }

    loadVoicesHandler()
    
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoicesHandler
    }
  }

  private getVoiceForLanguage(language: Language): SpeechSynthesisVoice | null {
    const langCode = SPEECH_LANG_MAP[language]
    
    // Try to find an exact match
    let voice = this.voices.find((v: SpeechSynthesisVoice) => v.lang === langCode)
    
    // If not found, try to find a voice that starts with the language code
    if (!voice) {
      const shortLang = langCode.split('-')[0]
      voice = this.voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith(shortLang))
    }
    
    return voice || null
  }

  speak(text: string, language: Language): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = SPEECH_LANG_MAP[language]
      
      const voice = this.getVoiceForLanguage(language)
      if (voice) {
        utterance.voice = voice
      }

      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => resolve()
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => reject(event.error)

      this.synth.speak(utterance)
    })
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false
  }
}

export const speechService = new SpeechService()
