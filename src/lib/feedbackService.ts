// Feedback service for haptic and audio feedback

export class FeedbackService {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
    }
  }

  // Haptic feedback (vibration)
  vibrate(pattern: number | number[] = 50): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  // Success vibration pattern
  vibrateSuccess(): void {
    this.vibrate([50, 100, 50])
  }

  // Error vibration pattern
  vibrateError(): void {
    this.vibrate([100, 50, 100])
  }

  // Single short vibration for detection
  vibrateDetection(): void {
    this.vibrate(30)
  }

  // Audio feedback - success tone
  playSuccessTone(): void {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.2)
    } catch (error) {
      console.error('Audio feedback error:', error)
    }
  }

  // Audio feedback - detection tone (subtle)
  playDetectionTone(): void {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = 600
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch (error) {
      console.error('Audio feedback error:', error)
    }
  }

  // Audio feedback - error tone
  playErrorTone(): void {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = 300
      oscillator.type = 'sawtooth'

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.error('Audio feedback error:', error)
    }
  }

  // Combined feedback for gesture detection
  gestureDetected(confidence: number): void {
    if (confidence > 0.7) {
      this.vibrateDetection()
      this.playDetectionTone()
    }
  }

  // Combined feedback for successful translation
  translationSuccess(): void {
    this.vibrateSuccess()
    this.playSuccessTone()
  }

  // Combined feedback for error
  error(): void {
    this.vibrateError()
    this.playErrorTone()
  }
}

export const feedbackService = new FeedbackService()
