'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Square, Loader2, Sparkles } from 'lucide-react'
import { ErrorMessage } from './ErrorMessage'
import { analyzeGestureFromImage, getGesturePhrase } from '@/lib/gestureRecognition'
import { feedbackService } from '@/lib/feedbackService'
import { Badge } from '@/components/ui/badge'

interface GestureCameraProps {
  onCapture: (imageUrl: string, gesture?: string, confidence?: number) => void
  isProcessing?: boolean
}

export function GestureCamera({ onCapture, isProcessing = false }: GestureCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [detectedGesture, setDetectedGesture] = useState<string>('')
  const [gestureConfidence, setGestureConfidence] = useState<number>(0)

  const startCamera = async (): Promise<void> => {
    try {
      setError('')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('camera_not_supported')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsStreaming(true)
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
    }
  }

  const captureImage = async (): Promise<void> => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageUrl)
    stopCamera()
    
    // Analyze gesture from captured image
    setIsAnalyzing(true)
    try {
      const gestureResult = await analyzeGestureFromImage(imageUrl)
      
      console.log('📸 Capture Analysis:', gestureResult)
      
      // Clear threshold for accurate detection (0.75+)
      if (gestureResult.confidence >= 0.75 && gestureResult.gesture !== 'unknown') {
        const phraseKey = getGesturePhrase(gestureResult.gesture)
        setDetectedGesture(gestureResult.gesture)
        setGestureConfidence(gestureResult.confidence)
        
        console.log('✅ GESTURE DETECTED IN PHOTO:', phraseKey, gestureResult.confidence)
        
        // Haptic and audio feedback
        feedbackService.gestureDetected(gestureResult.confidence)
        
        if (phraseKey !== 'unknown') {
          onCapture(imageUrl, phraseKey, gestureResult.confidence)
        } else {
          onCapture(imageUrl)
        }
      } else {
        console.log('❌ NO CLEAR GESTURE:', gestureResult)
        setDetectedGesture('not detected')
        setGestureConfidence(0)
        onCapture(imageUrl)
      }
    } catch (error) {
      console.error('Gesture analysis error:', error)
      onCapture(imageUrl)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const retake = (): void => {
    setCapturedImage(null)
    setDetectedGesture('')
    setGestureConfidence(0)
    startCamera()
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900/60 to-purple-900/60 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="relative aspect-video bg-gradient-to-br from-slate-950 to-purple-950 rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
            {capturedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured gesture"
                  className="w-full h-full object-cover"
                />
                
                {/* Analysis overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-center text-white">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-3 mx-auto w-fit shadow-2xl shadow-purple-500/50">
                        <Loader2 className="w-10 h-10 animate-spin" />
                      </div>
                      <p className="text-sm text-purple-200">Analyzing gesture with improved AI...</p>
                      <p className="text-xs text-purple-300 mt-1">More sensitive detection</p>
                    </div>
                  </div>
                )}
                
                {/* Detection result badge */}
                {!isAnalyzing && detectedGesture && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {detectedGesture === 'not detected' ? (
                      <>
                        <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/50 border-0">
                          <Sparkles className="w-4 h-4 mr-1" />
                          No clear gesture detected
                        </Badge>
                        <div className="text-xs text-white bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 border border-orange-500/30">
                          <p>💡 Tips:</p>
                          <p>• Make gesture more distinct</p>
                          <p>• Ensure good lighting</p>
                          <p>• Hand clearly visible</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/50 border-0">
                          <Sparkles className="w-4 h-4 mr-1" />
                          {detectedGesture}
                        </Badge>
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/50 border-0">
                          {Math.round(gestureConfidence * 100)}% match
                        </Badge>
                        <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/50 border-0 animate-pulse">
                          ✓ Detected Successfully!
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
                    <div className="text-center text-white">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mb-4 mx-auto w-fit shadow-2xl shadow-purple-500/50 animate-pulse">
                        <Camera className="w-16 h-16" />
                      </div>
                      <p className="text-sm text-purple-200">Camera not active</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

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
                  message="Unable to access camera. Please check your camera permissions and try again."
                  onRetry={startCamera}
                />
              )}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {!isStreaming && !capturedImage && (
              <Button onClick={startCamera} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl shadow-purple-500/50 border-0">
                <Camera className="w-5 h-5 mr-2" />
                Start Camera
              </Button>
            )}

            {isStreaming && !capturedImage && (
              <>
                <Button onClick={captureImage} size="lg" disabled={isProcessing || isAnalyzing} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl shadow-amber-500/50 border-0">
                  {isProcessing || isAnalyzing ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
                </Button>
                <Button onClick={stopCamera} variant="outline" size="lg" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {capturedImage && (
              <Button onClick={retake} variant="outline" size="lg" className="w-full sm:w-auto border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
                Retake Photo
              </Button>
            )}
          </div>

          {isStreaming && !capturedImage && (
            <div className="text-center text-sm text-purple-300 bg-purple-900/20 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
              <p className="flex items-center justify-center gap-2">
                ✨ <span>Improved AI with better sensitivity!</span>
              </p>
              <p className="text-xs text-purple-400 mt-1">Position your hand clearly and click Capture & Analyze</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
