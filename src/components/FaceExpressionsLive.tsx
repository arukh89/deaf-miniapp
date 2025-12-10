'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Square, Smile, Loader2 } from 'lucide-react'
import { ErrorMessage } from './ErrorMessage'
import { useIsInFarcaster } from '@/hooks/useIsInFarcaster'

type WorkerMsg =
  | { type: 'READY' }
  | { type: 'RESULT'; payload: { events?: string[] } }
  | { type: 'ERROR'; payload: string }

interface Props {
  active?: boolean
  onEvent?: (phraseKey: string) => void
}

export function FaceExpressionsLive({ active = false, onEvent }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [running, setRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [lastEvent, setLastEvent] = useState<string>('')
  const cooldownUntilRef = useRef<number>(0)
  const isMiniApp = useIsInFarcaster()

  const worker = useMemo(
    () => new Worker(new URL('@/workers/face.worker.ts', import.meta.url), { type: 'module' }),
    []
  )

  useEffect(() => {
    const w = worker as unknown as Worker
    const onMsg = (e: MessageEvent<WorkerMsg>) => {
      const data: any = e.data; const { type, payload } = data || {}
      if (type === 'RESULT') {
        const now = performance.now()
        const evts = payload?.events || []
        if (evts.length) {
          const key = evts[0]
          setLastEvent(key)
          if (onEvent && now >= cooldownUntilRef.current) {
            onEvent(key)
            cooldownUntilRef.current = now + 1000
          }
        }
      } else if (type === 'ERROR') {
        setError(payload || 'Face pipeline error')
      }
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ type: 'INIT' })
    return () => {
      w.removeEventListener('message', onMsg)
      w.terminate()
    }
  }, [worker, onEvent])

  const start = async () => {
    try {
      setError('')
      setIsLoading(true)
      // In Farcaster Mini App, request permissions via host first
      if (isMiniApp) {
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk')
          if (sdk?.actions?.requestCameraAndMicrophoneAccess) {
            await sdk.actions.requestCameraAndMicrophoneAccess()
          }
        } catch (e) {
          setError('permission_denied')
          return
        }
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('camera_not_supported')
        return
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = media
        try {
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('webkit-playsinline', 'true')
          videoRef.current.setAttribute('muted', 'true')
          ;(videoRef.current as any).playsInline = true
          videoRef.current.muted = true
        } catch {}
        try { await videoRef.current.play() } catch {}
      }
      setStream(media)
      setRunning(true)
      loop()
    } catch (e: any) {
      const name = e?.name
      if (name === 'NotAllowedError') setError('permission_denied')
      else if (name === 'NotFoundError') setError('no_camera')
      else setError('general')
    } finally {
      setIsLoading(false)
    }
  }

  const stop = () => {
    try {
      stream?.getTracks().forEach((t) => t.stop())
    } catch {}
    setStream(null)
    setRunning(false)
  }

  const loop = async () => {
    if (!running) return
    const v = videoRef.current
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      try {
        const bitmap = await createImageBitmap(v)
        ;(worker as any).postMessage({ type: 'FRAME', payload: { bitmap, ts: performance.now() } }, [bitmap as any])
      } catch {}
    }
    // ~20 FPS
    setTimeout(loop, 50)
  }

  // Auto start/stop when tab active toggles
  useEffect(() => {
    if (active && !running) void start()
    if (!active && running) stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => () => stop(), [])

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900/60 to-blue-900/60 backdrop-blur-xl border-blue-500/30 shadow-2xl shadow-blue-500/20">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="space-y-4">
          <div className="relative h-[70vh] bg-gradient-to-br from-slate-950 to-blue-950 rounded-lg overflow-hidden border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

            {!running && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 mx-auto w-fit shadow-2xl shadow-blue-500/50 animate-pulse">
                    <Smile className="w-16 h-16" />
                  </div>
                  <p className="text-sm text-blue-200">Face expressions not active</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950/90 to-blue-950/90 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 mx-auto w-fit shadow-2xl shadow-blue-500/50">
                    <Loader2 className="w-12 h-12 animate-spin" />
                  </div>
                  <p className="text-sm text-blue-200">Loading face pipeline...</p>
                </div>
              </div>
            )}

            {running && lastEvent && (
              <div className="absolute top-4 right-4 flex flex-col gap-2 animate-in slide-in-from-right duration-300">
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/50 border-0 animate-pulse">
                  <Smile className="w-4 h-4 mr-1" />
                  {lastEvent}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {!running && !isLoading && (
              <Button onClick={start} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/50 border-0">
                <Camera className="w-5 h-5 mr-2" />
                Start Face Expressions
              </Button>
            )}

            {running && (
              <Button onClick={stop} variant="destructive" size="lg" className="shadow-xl shadow-red-500/50">
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
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
                  onRetry={start}
                />
              )}
              {error === 'no_camera' && (
                <ErrorMessage
                  type="camera"
                  message="No camera was found on your device. Please connect a camera and try again."
                  onRetry={start}
                />
              )}
              {error === 'general' && (
                <ErrorMessage
                  type="camera"
                  message="Unable to load face expressions. Please try again."
                  onRetry={start}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

