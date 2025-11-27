'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Square, Loader2, Hand } from 'lucide-react'
import { ErrorMessage } from './ErrorMessage'
import type { Hands, Results } from '@mediapipe/hands'
import { analyzeHandGesture, getGesturePhrase } from '@/lib/gestureRecognition'
import { Badge } from '@/components/ui/badge'
import { feedbackService } from '@/lib/feedbackService'

interface GestureCameraLiveProps {
  onGestureDetected: (phraseKey: string, confidence: number) => void
}

export function GestureCameraLive({ onGestureDetected }: GestureCameraLiveProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hands, setHands] = useState<Hands | null>(null)
  const [currentGesture, setCurrentGesture] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [lastTriggeredGesture, setLastTriggeredGesture] = useState<string>('')
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0)
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadMediaPipe = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const { Hands } = await import('@mediapipe/hands')
        const { Camera } = await import('@mediapipe/camera_utils')
        
        const handsInstance = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          }
        })

        // IMPROVED SETTINGS for better sensitivity
        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.3,  // LOWERED from 0.5 for better sensitivity
          minTrackingConfidence: 0.3    // LOWERED from 0.5 for better sensitivity
        })

        handsInstance.onResults((results: Results) => {
          const gestureResult = analyzeHandGesture(results)
          
          // CLEAR THRESHOLD: Only trigger on confident gestures (0.75+)
          if (gestureResult.confidence >= 0.75 && gestureResult.gesture !== 'unknown') {
            const phraseKey = getGesturePhrase(gestureResult.gesture)
            
            console.log('✅ HIGH CONFIDENCE GESTURE:', {
              gesture: gestureResult.gesture,
              phraseKey,
              confidence: gestureResult.confidence,
              debugInfo: gestureResult.debugInfo
            })
            
            setCurrentGesture(gestureResult.gesture)
            setConfidence(gestureResult.confidence)
            
            // Prevent rapid duplicates - only trigger if different or after delay
            const now = Date.now()
            const timeSinceLastTrigger = now - lastTriggerTime
            
            if (phraseKey !== 'unknown' && 
                (phraseKey !== lastTriggeredGesture || timeSinceLastTrigger > 2000)) {
              
              console.log('🎯 TRIGGERING TRANSLATION:', phraseKey)
              
              // Haptic and audio feedback
              feedbackService.gestureDetected(gestureResult.confidence)
              
              // Trigger translation
              onGestureDetected(phraseKey, gestureResult.confidence)
              
              setLastTriggeredGesture(phraseKey)
              setLastTriggerTime(now)
            }
          } else if (gestureResult.confidence >= 0.50) {
            // Show gesture but don't trigger translation
            setCurrentGesture(gestureResult.gesture)
            setConfidence(gestureResult.confidence)
            
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current)
            }
            
            detectionTimeoutRef.current = setTimeout(() => {
              setCurrentGesture('')
              setConfidence(0)
            }, 1000)
          } else {
            // Clear gesture display
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current)
            }
            
            detectionTimeoutRef.current = setTimeout(() => {
              setCurrentGesture('')
              setConfidence(0)
            }, 500)
          }

          // Draw hand landmarks on canvas
          if (canvasRef.current && results.multiHandLandmarks) {
            const canvasCtx = canvasRef.current.getContext('2d')
            if (canvasCtx) {
              canvasCtx.save()
              canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
              
              // Draw landmarks
              const { drawConnectors, drawLandmarks } = require('@mediapipe/drawing_utils')
              const { HAND_CONNECTIONS } = require('@mediapipe/hands')
              
              for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                  color: '#00FF00',
                  lineWidth: 3  // Increased from 2 for better visibility
                })
                drawLandmarks(canvasCtx, landmarks, {
                  color: '#FF0000',
                  lineWidth: 2,  // Increased from 1
                  radius: 4      // Increased from 3
                })
              }
              canvasCtx.restore()
            }
          }
        })

        setHands(handsInstance)
      } catch (err) {
        console.error('MediaPipe loading error:', err)
        setError('general')
      } finally {
        setIsLoading(false)
      }
    }

    loadMediaPipe()
    
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [onGestureDetected])

  const startCamera = async (): Promise<void> => {
    try {
      setError('')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('camera_not_supported')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },  // Higher resolution
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsStreaming(true)

        // Start MediaPipe camera
        if (hands) {
          const { Camera } = await import('@mediapipe/camera_utils')
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && hands) {
                await hands.send({ image: videoRef.current })
              }
            },
            width: 1280,  // Higher resolution
            height: 720
          })
          camera.start()
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      const error = err as Error
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('permission_denied')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setError('no_camera')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setError('camera_in_use')
      } else {
        setError('general')
      }
    }
  }

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      setStream(null)
      setIsStreaming(false)
      setCurrentGesture('')
      setConfidence(0)
      setLastTriggeredGesture('')
      setLastTriggerTime(0)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (hands) {
        hands.close()
      }
    }
  }, [hands])

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900/60 to-emerald-900/60 backdrop-blur-xl border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="relative aspect-video bg-gradient-to-br from-slate-950 to-emerald-950 rounded-lg overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full"
            />
            
            {!isStreaming && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/50 to-cyan-900/50 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-4 mx-auto w-fit shadow-2xl shadow-emerald-500/50 animate-pulse">
                    <Camera className="w-16 h-16" />
                  </div>
                  <p className="text-sm text-emerald-200">Camera not active</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950/90 to-emerald-950/90 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-4 mx-auto w-fit shadow-2xl shadow-emerald-500/50">
                    <Loader2 className="w-12 h-12 animate-spin" />
                  </div>
                  <p className="text-sm text-emerald-200">Loading gesture recognition...</p>
                </div>
              </div>
            )}

            {isStreaming && currentGesture && (
              <div className="absolute top-4 right-4 flex flex-col gap-2 animate-in slide-in-from-right duration-300">
                <Badge variant="secondary" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/50 border-0 animate-pulse">
                  <Hand className="w-4 h-4 mr-1" />
                  {currentGesture}
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/50 border-0">
                  {Math.round(confidence * 100)}% confidence
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/50 border-0 animate-pulse">
                  ✓ Detected!
                </Badge>
              </div>
            )}
            
            {/* Visual feedback indicator */}
            {isStreaming && !currentGesture && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-full border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-300">Ready - Instant Detection</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4">
              {error === 'camera_not_supported' && (
                <ErrorMessage
                  type="camera"
                  message="Your browser doesn't support camera access. Please use a modern browser like Chrome, Safari, or Firefox."
                />
              )}
              {error === 'permission_denied' && (
                <ErrorMessage
                  type="camera"
                  message="Camera access was denied. Please allow camera permissions in your browser settings."
                  onRetry={startCamera}
                />
              )}
              {error === 'no_camera' && (
                <ErrorMessage
                  type="camera"
                  message="No camera was found on your device. Please connect a camera and try again."
                  onRetry={startCamera}
                />
              )}
              {error === 'camera_in_use' && (
                <ErrorMessage
                  type="camera"
                  message="Your camera is being used by another application. Please close other apps and try again."
                  onRetry={startCamera}
                />
              )}
              {error === 'general' && (
                <ErrorMessage
                  type="camera"
                  message="Unable to load gesture recognition. Please try again or use manual input."
                  onRetry={startCamera}
                />
              )}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {!isStreaming && !isLoading && (
              <Button onClick={startCamera} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-xl shadow-emerald-500/50 border-0">
                <Camera className="w-5 h-5 mr-2" />
                Start Live Detection
              </Button>
            )}

            {isStreaming && (
              <Button onClick={stopCamera} variant="destructive" size="lg" className="shadow-xl shadow-red-500/50">
                <Square className="w-5 h-5 mr-2" />
                Stop Detection
              </Button>
            )}
          </div>

          {isStreaming && (
            <div className="space-y-2">
              <div className="text-sm text-center text-emerald-300 backdrop-blur-sm bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/30">
                <p className="flex items-center justify-center gap-2">
                  ⚡ <span>INSTANT detection - Just make gestures naturally!</span>
                </p>
                <p className="mt-1 text-xs text-emerald-400">More sensitive • Faster response • No hold required</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-2 border border-emerald-500/20">
                  <p className="text-emerald-300 font-medium">✋ Open palm = Hello</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-2 border border-blue-500/20">
                  <p className="text-blue-300 font-medium">👍 Thumbs up = Yes</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-2 border border-purple-500/20">
                  <p className="text-purple-300 font-medium">✌️ Peace = Nice</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-2 border border-pink-500/20">
                  <p className="text-pink-300 font-medium">👌 OK = Thank you</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
