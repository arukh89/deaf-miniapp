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
  ko: 'ko-KR',
}

export class SpeechService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private resumeInterval: number | null = null

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

  private async waitForVoices(timeoutMs = 1500): Promise<void> {
    if (!this.synth) return
    // If we already have voices, continue immediately
    if (this.voices.length > 0) return
    await new Promise<void>((resolve) => {
      const started = Date.now()
      const poll = () => {
        if (!this.synth) return resolve()
        const list = this.synth.getVoices()
        if (list.length > 0) {
          this.voices = list
          return resolve()
        }
        if (Date.now() - started > timeoutMs) return resolve()
        setTimeout(poll, 100)
      }
      // also hook event if it fires
      if (this.synth) this.synth.onvoiceschanged = () => poll()
      poll()
    })
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
      if (!this.synth) return reject(new Error('speech_not_supported'))

      // Cancel any ongoing speech
      this.synth.cancel()

      const run = async () => {
        // Ensure voices are loaded BEFORE speaking (important on iOS/WebViews)
        await this.waitForVoices(2000)

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = SPEECH_LANG_MAP[language]
        // Pick best voice for target language or fallback to default voice
        const voice = this.getVoiceForLanguage(language)
        if (voice) utterance.voice = voice

        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1

        // iOS / some WebViews may pause the queue until user gesture; force resume periodically
        try { this.synth?.resume() } catch {}
        if (this.resumeInterval) {
          try { clearInterval(this.resumeInterval) } catch {}
        }
        this.resumeInterval = window.setInterval(() => {
          try { this.synth?.resume() } catch {}
        }, 200)

        utterance.onend = () => {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval)
            this.resumeInterval = null
          }
          resolve()
        }
        utterance.onerror = () => {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval)
            this.resumeInterval = null
          }
          reject(new Error('speech_failed'))
        }

        this.synth?.speak(utterance)
      }

      void run()
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
